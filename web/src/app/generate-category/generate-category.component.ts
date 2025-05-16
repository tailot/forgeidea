import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Observable, of, firstValueFrom, map } from 'rxjs'; // Added map
import { catchError } from 'rxjs/operators';

import { GenkitService, Idea, EncryptedPayloadData } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-generate-category',
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './generate-category.component.html',
  styleUrl: './generate-category.component.sass'
})
export class GenerateCategoryComponent implements OnInit {

  private genkitService = inject(GenkitService);
  private languageService = inject(LanguageService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  categories$: Observable<string[]> = of([]);
  errorMessage: string | null = null;
  selectedCategory: string | null = null;
  isGenerating: boolean = false;
  scoreThreshold: number = 0;
  searchTerm: string = '';

  generator: string | undefined = undefined;
  _categories: EncryptedPayloadData | undefined;
  _idea: EncryptedPayloadData | undefined;

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

  async ngOnInit(): Promise<void> {
    this.scoreThreshold = await this.loadItemFromStorage<number>(
      'score',
      "'score'",
      0,
      (value): value is number => value !== null && typeof value === 'number'
    );

    this.generator = await this.loadItemFromStorage<string | undefined>(
      'generator',
      "'generator'",
      '',
      (value): value is string => typeof value === 'string' && value.length > 0
    );

    this._categories = await this.loadItemFromStorage<EncryptedPayloadData | undefined>(
      '_categories',
      "'_categories' (payload)",
      undefined,
      (value): value is EncryptedPayloadData => !!value
    );

    this._idea = await this.loadItemFromStorage<EncryptedPayloadData | undefined>(
      '_idea',
      "'_idea' (payload)",
      undefined,
      (value): value is EncryptedPayloadData => !!value
    );

    this.loadCategories();
  }

  loadCategories(context = ""): void {
    this.errorMessage = null;
    this.isGenerating = false;
    const currentLanguageCode = this.languageService.getCurrentLanguageCode();
    const currentLanguageBackendName = this.languageService.getCurrentLanguageBackendName();

    if (this.generator && this._categories) {
      console.log(`GenerateCategoryComponent: Loading categories using execFlow for generator: ${this.generator}, language: ${currentLanguageBackendName}`);
      const contextparam = context == '' ? this.generator : context;
          console.log(`GenerateCategoryComponent: Context parameter for execFlow: ${contextparam}`);
      const execFlowData: Parameters<GenkitService['callExecFlow']>[0] = {
        encryptedPromptPayload: this._categories,
        promptVariables: {
          count: 20,
          context: contextparam,
          language: currentLanguageBackendName
        }
      };
      this.categories$ = this.genkitService.callExecFlow(execFlowData, true).pipe(
        map(commaSeparatedCategories => {
          if (!commaSeparatedCategories || commaSeparatedCategories.trim() === '') {
            console.warn('GenerateCategoryComponent: execFlow returned empty or whitespace categories string.');
            return [];
          }
          return commaSeparatedCategories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
        }),
        catchError(error => {
          console.error('GenerateCategoryComponent: Error loading categories via execFlow:', error);
          this.errorMessage = error instanceof Error ? error.message : 'Failed to load categories using custom generator. Please try again later.';
          return of([]);
        })
      );
    } else {
      console.log(`GenerateCategoryComponent: Loading categories using callGenerateIdeaCategories for language code: ${currentLanguageCode} (Backend: ${currentLanguageBackendName}), context: ${context}`);
      this.categories$ = this.genkitService.callGenerateIdeaCategories({ context: context, count: 35, language: currentLanguageBackendName })
        .pipe(
          catchError(error => {
            console.error('GenerateCategoryComponent: Error loading categories with callGenerateIdeaCategories:', error);
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load categories. Please try again later.';
            return of([]);
          })
        );
    }
  }

  async onCategorySelectionChange(selected: string | string[] | undefined): Promise<void> {
    if (typeof selected !== 'string' || !selected || this.isGenerating) {
      if (this.isGenerating) {
        console.warn('Generation already in progress.');
      } else {
        console.log('Category selection cleared or invalid.');
        this.selectedCategory = null;
      }
      return;
    }

    this.selectedCategory = selected;
    this.errorMessage = null;
    this.isGenerating = true;
    console.log('Selected category:', this.selectedCategory);

    const currentLanguageBackendName = this.languageService.getCurrentLanguageBackendName();
    try {
      let ideaText: string;
      let generatedIdeaCategory = this.selectedCategory;

      if (this.generator && this._idea) {
        console.log(`GenerateCategoryComponent: Using custom generator '${this.generator}' and _idea prompt.`);
        const execFlowData: Parameters<GenkitService['callExecFlow']>[0] = {
          encryptedPromptPayload: this._idea,
          promptVariables: {
            language: currentLanguageBackendName,
            category: this.selectedCategory
          }
        };
        console.log(`Generating idea using execFlow with _idea for category: ${this.selectedCategory}, language: ${currentLanguageBackendName}`);
        ideaText = await firstValueFrom(
          this.genkitService.callExecFlow(execFlowData, true)
        );
        if (!ideaText || ideaText.trim() === '') {
          throw new Error('Received empty or invalid idea text from custom _idea execFlow.');
        }
      } else if (this.scoreThreshold > 0) {
        console.log(`GenerateCategoryComponent: scoreThreshold is ${this.scoreThreshold}, calling callRequirementScore.`);
        const requirementScoreRequestData = {
          category: this.selectedCategory,
          maxscore: this.scoreThreshold,
          language: currentLanguageBackendName,
        };
        console.log(`Generating idea using requirement score for category: ${requirementScoreRequestData.category}, language: ${requirementScoreRequestData.language}, maxscore: ${requirementScoreRequestData.maxscore}`);

        ideaText = await firstValueFrom(
          this.genkitService.callRequirementScore(requirementScoreRequestData, true)
        );
        if (!ideaText) {
          throw new Error('Received invalid idea text from callRequirementScore service.');
        }
      } else {
        console.log(`GenerateCategoryComponent: scoreThreshold is ${this.scoreThreshold}, calling callGenerateIdea.`);
        const generateIdeaRequestData = {
          category: this.selectedCategory,
          language: currentLanguageBackendName
        };
        console.log(`Generating idea for category: ${generateIdeaRequestData.category}, language: ${generateIdeaRequestData.language}`);

        const generatedIdeaResult = await firstValueFrom(
          this.genkitService.callGenerateIdea(generateIdeaRequestData, true)
        );
        console.log(generatedIdeaResult.text)
        if (!generatedIdeaResult || !generatedIdeaResult.text) {
          throw new Error('Received invalid idea data from callGenerateIdea service.');
        }
        ideaText = generatedIdeaResult.text;
        generatedIdeaCategory = generatedIdeaResult.category || this.selectedCategory;
      }

      const ideaUuid = crypto.randomUUID();

      const ideaToStore: Idea & { id: string, category: string, language?: string } = {
        text: ideaText,
        id: ideaUuid,
        category: generatedIdeaCategory,
        language: currentLanguageBackendName
      };

      console.log(`Generated idea: "${ideaToStore.text}", UUID: ${ideaToStore.id}`);

      await this.storageService.setItem<Idea & { id: string }>(ideaToStore.id, ideaToStore);
      console.log(`Idea with UUID ${ideaToStore.id} saved to storage.`);
      await this.router.navigate(['/jobcard', ideaToStore.id]);
      console.log(`Navigated to /jobcard/${ideaToStore.id}`);

    } catch (error) {
      console.error('Error during idea generation, saving, or navigation:', error);
      this.errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while processing the idea.';
    } finally {
      this.isGenerating = false;
    }
  }
}