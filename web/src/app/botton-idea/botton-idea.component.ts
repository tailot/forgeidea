/**
 * @fileoverview Defines the `BottonIdeaComponent` for the Angular web application.
 *
 * This component provides a user interface element, typically a button,
 * that allows users to trigger the generation of a random creative idea.
 * It coordinates with various services to:
 *  - Fetch the current language setting (`LanguageService`).
 *  - Call a backend service (`GenkitService`) to generate a random idea based on the language.
 *  - Store the generated idea locally (`StorageService`).
 *  - Navigate the user to a new view (`/jobcard/:uuid`) to display the generated idea (`Router`).
 * The component also manages loading and error states during the idea generation process.
 * It uses `ChangeDetectionStrategy.OnPush` for performance optimization.
 */
// Angular Core and Router
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

// Application-specific Services and Models
import { GenkitService, Idea } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';

/**
 * Component responsible for providing a button that, when clicked,
 * generates a random idea, stores it, and navigates to a view displaying the idea.
 *
 * It handles user interaction for idea generation, manages loading and error states,
 * and coordinates with services for backend communication, language settings,
 * local storage, and routing.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-botton-idea' - The HTML tag used to embed this component.
 *  - `imports`: An array of Angular Material modules used by this component's template:
 *    - `MatCardModule`: For styling content containers.
 *    - `MatButtonModule`: For themed buttons.
 *    (Note: This component is likely intended to be standalone, given the `imports` array
 *     in the decorator, but `standalone: true` is missing in the provided snippet.
 *     Assuming it should be standalone based on common Angular practices with this structure.)
 *  - `templateUrl`: './botton-idea.component.html' - Path to the component's HTML template.
 *  - `styleUrl`: './botton-idea.component.sass' - Path to the component's Sass stylesheet.
 *  - `changeDetection`: `ChangeDetectionStrategy.OnPush` - Optimizes change detection
 *    to run primarily when inputs change or events are explicitly handled, improving performance.
 */
@Component({
  selector: 'app-botton-idea',
  imports: [
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './botton-idea.component.html',
  styleUrl: './botton-idea.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottonIdeaComponent {
  /**
   * Flag to indicate if an idea generation request is currently in progress.
   * Used to control UI elements, such as disabling a button or showing a loading indicator.
   * @type {boolean}
   */
  isLoading = false;
  /**
   * Stores the most recently generated idea.
   * It is `null` if no idea has been generated yet or if an error occurred.
   * @type {(Idea | null)}
   */
  generatedIdea: Idea | null = null;
  /**
   * Stores an error message if an error occurs during the idea generation process.
   * It is `null` if there is no error.
   * @type {(string | null)}
   */
  errorMessage: string | null = null;

  /**
   * Constructs the BottonIdeaComponent.
   *
   * @param {GenkitService} genkitService - Service for interacting with the Genkit backend to generate ideas.
   * @param {StorageService} storageService - Service for storing data locally (e.g., the generated idea).
   * @param {LanguageService} languageService - Service for obtaining the current language preference.
   * @param {Router} router - Angular's Router service for programmatic navigation.
   */
  constructor(
    private genkitService: GenkitService,
    private storageService: StorageService,
    private languageService: LanguageService,
    private router: Router
  ) { }

  /**
   * Handles the click event from the idea generation button.
   *
   * This method initiates the process of generating a random idea:
   * 1. Sets the `isLoading` flag to true and clears any previous idea or error message.
   * 2. Retrieves the current language setting using `LanguageService`.
   * 3. Calls `genkitService.callRandomIdea()` to request a new idea from the backend.
   * 4. On successful idea generation:
   *    - Logs the success.
   *    - Generates a unique ID (UUID) for the new idea.
   *    - Stores the generated idea in `generatedIdea`.
   *    - Saves the idea to local storage using `StorageService` with the UUID as the key.
   *    - Sets `isLoading` to false.
   *    - Navigates the user to the '/jobcard/:uuid' route to display the new idea.
   * 5. On error:
   *    - Logs the error.
   *    - Sets `errorMessage` to display the error to the user.
   *    - Sets `isLoading` to false.
   */
  onButtonClick() {
    console.log('Attempting to generate random idea...');
    this.isLoading = true;
    this.generatedIdea = null;
    this.errorMessage = null;

    const language = this.languageService.getCurrentLanguageBackendName();

    this.genkitService.callRandomIdea({ language }, true).subscribe({
      next: (idea: Idea) => {
        console.log('Idea generated successfully:', idea);
        const uuid = crypto.randomUUID()
        this.generatedIdea = idea;
        this.storageService.setItem(uuid, this.generatedIdea)
        this.isLoading = false;
        this.router.navigate(['/jobcard', uuid]);
      },
      error: (error) => {
        console.error('Error during idea generation:', error);
        this.errorMessage = error.message || 'An unknown error occurred.';
        this.isLoading = false;
      }
    });
  }
}
