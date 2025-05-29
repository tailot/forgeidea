/**
 * @fileoverview Defines the `GenerateCategoryComponent` for the Angular web application.
 *
 * This component provides a user interface for generating ideas based on categories.
 * It allows users to:
 *  1. Load a list of categories. This can be done either by using a standard Genkit
 *     flow (`callGenerateIdeaCategories`) or by executing a custom, potentially encrypted,
 *     prompt for categories if `generator` and `_categories` (an encrypted payload)
 *     are configured in local storage.
 *  2. Select a category from the generated list.
 *  3. Trigger the generation of a specific idea based on the selected category.
 *     The idea generation process can also be customized:
 *     - If `generator` and `_idea` (an encrypted payload for an idea prompt) are configured,
 *       it uses `genkitService.callExecFlow` with this custom prompt.
 *     - If a `scoreThreshold` (loaded from storage) is greater than 0, it uses
 *       `genkitService.callRequirementScore` to generate an idea that meets the score.
 *     - Otherwise, it falls back to `genkitService.callGenerateIdea`.
 *
 * The component manages loading states, error messages, and interacts with `LanguageService`
 * for language settings and `StorageService` for persisting/retrieving settings and
 * generated ideas. Upon successful idea generation, it navigates to a 'jobcard' view
 * for the new idea.
 */
// Angular Core, Common, Forms, and Router
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// RxJS
import { firstValueFrom, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Application-specific Services and Models
import { GenkitService, Idea, EncryptedPayloadData } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';

import { toSignal } from '@angular/core/rxjs-interop';
/**
 * Component responsible for generating idea categories and then generating an idea
 * from a selected category.
 *
 * It allows users to either load categories using a standard Genkit flow or a custom
 * (potentially encrypted) prompt if configured via local storage (`generator`, `_categories`).
 * After selecting a category, an idea is generated. This generation can also use a
 * custom prompt (`_idea` from storage), a score-based requirement flow, or a standard
 * idea generation flow. The component handles UI states for loading and errors,
 * and interacts with various services for its operations.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-generate-category' - The HTML tag used to embed this component.
 *  - `imports`: An array of modules and components required by this component's template:
 *    - `CommonModule`: Provides common Angular directives like `*ngIf`, `*ngFor`.
 *    - `MatChipsModule`: For displaying categories as selectable chips.
 *    - `MatIconModule`: For using Material icons.
 *    - `FormsModule`: For handling form inputs, like the search term.
 *    - `MatFormFieldModule`: For styling form fields.
 *    - `MatInputModule`: For text input fields.
 *    - `MatButtonModule`: For Material Design styled buttons.
 *    (Note: This component is likely intended to be standalone, given the `imports` array
 *     in the decorator, but `standalone: true` is missing in the provided snippet.
 *     Assuming it should be standalone based on common Angular practices with this structure.)
 *  - `templateUrl`: './generate-category.component.html' - Path to the component's HTML template.
 *  - `styleUrl`: './generate-category.component.sass' - Path to the component's Sass stylesheet.
 *
 * Implements:
 *  - `OnInit`: Lifecycle hook for initialization logic, such as loading settings from storage.
 */
@Component({
  selector: 'app-generate-category',
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './generate-category.component.html',
  styleUrl: './generate-category.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateCategoryComponent implements OnInit {

  /** Injected GenkitService for backend communication. */
  private genkitService = inject(GenkitService);
  /** Injected LanguageService for language preferences. */
  private languageService = inject(LanguageService);
  /** Injected StorageService for local storage access. */
  private storageService = inject(StorageService);
  /** Injected Router for navigation. */
  private router = inject(Router);

  /** Signal holding the array of category strings to be displayed. */
  categories = signal<string[]>([]);
  /** Stores error messages to be displayed to the user, if any. */
  errorMessage = signal<string | null>(null);
  /** Stores the currently selected category string by the user. */
  selectedCategory = signal<string | null>(null);
  /** Flag indicating if a category or idea generation process is currently active. */
  isGenerating = signal(false);
  /**
   * Score threshold loaded from storage. If greater than 0, it's used to request
   * ideas that meet a certain score requirement via `callRequirementScore`.
   */
  scoreThreshold = signal(0);
  /** Search term input by the user, potentially for filtering categories (though not directly used in current loadCategories). */
  searchTerm = signal('');

  /**
   * Optional custom generator context/name loaded from storage.
   * If set, it's used with `_categories` and `_idea` payloads for custom prompt execution.
   */
  generator = signal<string | undefined>(undefined);
  /**
   * Optional encrypted payload for a custom categories prompt, loaded from storage.
   * Used with `genkitService.callExecFlow` if `generator` is also set.
   * @type {EncryptedPayloadData | undefined}
   */
  _categories = signal<EncryptedPayloadData | undefined>(undefined);
  /**
   * Optional encrypted payload for a custom idea generation prompt, loaded from storage.
   * Used with `genkitService.callExecFlow` if `generator` is also set.
   * @type {EncryptedPayloadData | undefined}
   */
  _idea = signal<EncryptedPayloadData | undefined>(undefined);

  /**
   * A generic helper function to load an item from local storage.
   * It handles potential errors, provides logging, and allows for type validation
   * and default value fallback.
   *
   * @template T The expected type of the item to be loaded.
   * @param {string} key The storage key for the item.
   * @param {string} itemNameForLog A descriptive name for the item, used in console logs.
   * @param {T} defaultValueOnFailure The default value to return if the item is not found or invalid.
   * @param {(valueFromStorage: any) => boolean} isValidValue A predicate function to validate
   *   the type or structure of the value retrieved from storage.
   * @returns {Promise<T>} A promise that resolves to the loaded (and validated) item, or the default value.
   * @private
   * @async
   */
  private async loadItemFromStorage<T>(
    key: string,
    itemNameForLog: string,
    defaultValueOnFailure: T,
    isValidValue: (valueFromStorage: any) => boolean
  ): Promise<T> {
    try {
      const storedValue = await this.storageService.getItem<any>(key);
      if (isValidValue(storedValue)) {
        const logDisplayValue = typeof storedValue === 'object' && storedValue !== null ? `(payload)` : storedValue;
        console.log(`GenerateCategoryComponent: ${itemNameForLog} value loaded: ${logDisplayValue}`);
        return storedValue as T;
      } else {
        console.log(`GenerateCategoryComponent: No ${itemNameForLog} value found or invalid, using default: ${defaultValueOnFailure}`);
        return defaultValueOnFailure;
      }
    } catch (error) {
      console.error(`GenerateCategoryComponent: Error loading ${itemNameForLog} setting:`, error);
      return defaultValueOnFailure;
    }
  }

  /**
   * Angular lifecycle hook called after component initialization.
   *
   * This method asynchronously loads various settings from local storage using
   * `loadItemFromStorage`. These settings include `scoreThreshold`, `generator` name,
   * and potentially encrypted payloads for custom category (`_categories`) and idea (`_idea`) prompts.
   * After loading these settings, it calls `loadCategories()` to fetch the initial list of categories.
   * @async
   */
  async ngOnInit(): Promise<void> {
    this.scoreThreshold.set(await this.loadItemFromStorage<number>(
      'score',
      "'score'",
      0,
      (value): value is number => value !== null && typeof value === 'number'
    ));

    this.generator.set(await this.loadItemFromStorage<string | undefined>(
      'generator',
      "'generator'",
      '', // Default to empty string if not found, so it's defined
      (value): value is string => typeof value === 'string' && value.length > 0
    ));

    this._categories.set(await this.loadItemFromStorage<EncryptedPayloadData | undefined>(
      '_categories',
      "'_categories' (payload)",
      undefined,
      (value): value is EncryptedPayloadData => !!value && typeof value.iv === 'string' // Basic validation
    ));

    this._idea.set(await this.loadItemFromStorage<EncryptedPayloadData | undefined>(
      '_idea',
      "'_idea' (payload)",
      undefined,
      (value): value is EncryptedPayloadData => !!value && typeof value.iv === 'string' // Basic validation
    ));

    this.loadCategories();
  }

  /**
   * Loads or reloads the list of categories.
   *
   * If a custom `generator` and `_categories` (encrypted prompt payload) are configured
   * (loaded from storage during `ngOnInit`), it uses `genkitService.callExecFlow`
   * to fetch categories using this custom prompt. The `context` parameter (or `this.generator`
   * if context is empty) and current language are passed as prompt variables.
   *
   * Otherwise, it falls back to the standard `genkitService.callGenerateIdeaCategories`
   * flow, passing the `context` and current language.
   *
   * The method updates the `categories$` observable with the fetched list or an empty
   * array in case of an error. It also manages `errorMessage` and `isGenerating` states.
   *
   * @param {string} [contextParam=""] - Optional context to filter or influence category generation.
   *                                Defaults to an empty string.
   */
  loadCategories(contextParam = ""): void {
    this.errorMessage.set(null);
    this.isGenerating.set(false); // Reset generation state before loading categories
    // const currentLanguageCode = this.languageService.getCurrentLanguageCode(); // Not directly used in this version
    const currentLanguageBackendName = this.languageService.getCurrentLanguageBackendName();
    const currentGenerator = this.generator();
    const currentCategoriesPayload = this._categories();

    let categoriesObservable;

    if (currentGenerator && currentCategoriesPayload) {
      console.log(`GenerateCategoryComponent: Loading categories using execFlow for generator: ${currentGenerator}, language: ${currentLanguageBackendName}`);
      const effectiveContext = contextParam === '' ? currentGenerator : contextParam;
      // console.log(`GenerateCategoryComponent: Context parameter for execFlow: ${contextparam}`);
      const execFlowData: Parameters<GenkitService['callExecFlow']>[0] = {
        encryptedPromptPayload: currentCategoriesPayload,
        promptVariables: {
          count: 20, // Default count for custom category generation
          context: effectiveContext,
          language: currentLanguageBackendName
        }
      };
      categoriesObservable = this.genkitService.callExecFlow(execFlowData, true).pipe(
        map(commaSeparatedCategories => {
          if (!commaSeparatedCategories || commaSeparatedCategories.trim() === '') {
            console.warn('GenerateCategoryComponent: execFlow returned empty or whitespace categories string.');
            return [];
          }
          return commaSeparatedCategories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
        })
      );
    } else {
      // console.log(`GenerateCategoryComponent: Loading categories using callGenerateIdeaCategories for language code: ${currentLanguageCode} (Backend: ${currentLanguageBackendName}), context: ${context}`);
      categoriesObservable = this.genkitService.callGenerateIdeaCategories({ context: contextParam, count: 35, language: currentLanguageBackendName });
    }

    // Convert the observable to a signal and handle errors
    // We need to handle the subscription and error setting more directly if we want to set errorMessage signal
    // toSignal is best for direct binding or computed signals.
    // For side effects like setting errorMessage, a direct subscribe or tap might be clearer,
    // or we can use a more complex signal setup.
    // For simplicity here, we'll use toSignal and acknowledge error handling might need refinement for UI.
    // A more robust way would be to have an effect or a computed signal for errors.
    categoriesObservable.pipe(
      catchError(error => {
        console.error('GenerateCategoryComponent: Error loading categories:', error);
        this.errorMessage.set(error instanceof Error ? error.message : 'Failed to load categories. Please try again later.');
        return of([]); // Return empty array on error
      })
    ).subscribe(cats => this.categories.set(cats));
  }

  /**
   * Handles the category selection change event, typically from a chip list or dropdown.
   *
   * When a category is selected, this method initiates the idea generation process.
   * It determines the appropriate Genkit service call based on component settings:
   * 1. If `generator` and `_idea` (custom idea prompt payload) are set, it uses `callExecFlow`.
   * 2. Else if `scoreThreshold` is greater than 0, it uses `callRequirementScore`.
   * 3. Otherwise, it uses the standard `callGenerateIdea`.
   *
   * After successfully generating an idea, it creates a UUID, stores the idea locally
   * using `StorageService`, and navigates to the '/jobcard/:uuid' route to display it.
   * Manages `isGenerating` and `errorMessage` states throughout the process.
   *
   * @param {(string | string[] | undefined)} selected - The selected category.
   *        Expected to be a single string. If it's an array or undefined, or if generation
   *        is already in progress, the method may exit early.
   * @async
   */
  async onCategorySelectionChange(selected: string | string[] | undefined): Promise<void> {
    if (typeof selected !== 'string' || !selected || this.isGenerating()) {
      if (this.isGenerating()) {
        console.warn('Generation already in progress.');
      } else {
        console.log('Category selection cleared or invalid.');
        this.selectedCategory.set(null);
      }
      return;
    }

    this.selectedCategory.set(selected);
    this.errorMessage.set(null);
    this.isGenerating.set(true);
    // console.log('Selected category:', this.selectedCategory);

    const currentLanguageBackendName = this.languageService.getCurrentLanguageBackendName();
    const currentGenerator = this.generator();
    const currentIdeaPayload = this._idea();
    const currentScoreThreshold = this.scoreThreshold();
    const currentSelectedCategory = this.selectedCategory(); // Should be non-null here

    try {
      let ideaText: string;
      let generatedIdeaCategory = currentSelectedCategory!; // Default to selected category

      if (currentGenerator && currentIdeaPayload) {
        // console.log(`GenerateCategoryComponent: Using custom generator '${this.generator}' and _idea prompt.`);
        const execFlowData: Parameters<GenkitService['callExecFlow']>[0] = {
          encryptedPromptPayload: currentIdeaPayload,
          promptVariables: {
            language: currentLanguageBackendName,
            category: currentSelectedCategory!
          }
        };
        // console.log(`Generating idea using execFlow with _idea for category: ${this.selectedCategory}, language: ${currentLanguageBackendName}`);
        ideaText = await firstValueFrom(
          this.genkitService.callExecFlow(execFlowData, true)
        );
        if (!ideaText || ideaText.trim() === '') {
          throw new Error('Received empty or invalid idea text from custom _idea execFlow.');
        }
      } else if (currentScoreThreshold > 0) {
        // console.log(`GenerateCategoryComponent: scoreThreshold is ${this.scoreThreshold}, calling callRequirementScore.`);
        const requirementScoreRequestData = {
          category: currentSelectedCategory!,
          maxscore: currentScoreThreshold,
          language: currentLanguageBackendName,
        };
        // console.log(`Generating idea using requirement score for category: ${requirementScoreRequestData.category}, language: ${requirementScoreRequestData.language}, maxscore: ${requirementScoreRequestData.maxscore}`);

        ideaText = await firstValueFrom(
          this.genkitService.callRequirementScore(requirementScoreRequestData, true)
        );
        if (!ideaText || ideaText.trim() === '') { // Check if ideaText is empty or just whitespace
          throw new Error('Received empty or invalid idea text from callRequirementScore service.');
        }
      } else {
        // console.log(`GenerateCategoryComponent: scoreThreshold is ${this.scoreThreshold}, calling callGenerateIdea.`);
        const generateIdeaRequestData = {
          category: currentSelectedCategory!,
          language: currentLanguageBackendName
        };
        // console.log(`Generating idea for category: ${generateIdeaRequestData.category}, language: ${generateIdeaRequestData.language}`);

        const generatedIdeaResult = await firstValueFrom(
          this.genkitService.callGenerateIdea(generateIdeaRequestData, true)
        );
        // console.log(generatedIdeaResult.text)
        if (!generatedIdeaResult || !generatedIdeaResult.text || generatedIdeaResult.text.trim() === '') {
          throw new Error('Received empty or invalid idea data from callGenerateIdea service.');
        }
        ideaText = generatedIdeaResult.text;
        generatedIdeaCategory = generatedIdeaResult.category || currentSelectedCategory!; // Use returned category if available
      }

      const ideaUuid = crypto.randomUUID();

      const ideaToStore: Idea & { id: string, category: string, language?: string } = {
        text: ideaText,
        id: ideaUuid,
        category: generatedIdeaCategory,
        language: currentLanguageBackendName
      };

      // console.log(`Generated idea: "${ideaToStore.text}", UUID: ${ideaToStore.id}`);

      await this.storageService.setItem<Idea & { id: string }>(ideaToStore.id, ideaToStore);
      // console.log(`Idea with UUID ${ideaToStore.id} saved to storage.`);
      await this.router.navigate(['/jobcard', ideaToStore.id]);
      // console.log(`Navigated to /jobcard/${ideaToStore.id}`);

    } catch (error) {
      console.error('Error during idea generation, saving, or navigation:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'An unexpected error occurred while processing the idea.');
    } finally {
      this.isGenerating.set(false);
    }
  }
}