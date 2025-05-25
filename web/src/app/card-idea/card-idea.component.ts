/**
 * @fileoverview Defines the `CardIdeaComponent` for the Angular web application.
 *
 * This component is responsible for displaying a single "idea" within a card-style
 * user interface. It offers a rich set of functionalities for interacting with the idea,
 * including:
 *  - Displaying the idea's content and score.
 *  - Evaluating the idea's score on demand.
 *  - Generating and displaying associated tasks.
 *  - Performing operations such as combining the current idea with another.
 *  - Sharing the idea via Socket.IO.
 *  - Deleting the idea from local storage.
 *  - Adding the idea to a list (presumably in local storage).
 *
 * The component interacts with various services for backend communication (`GenkitService`),
 * local storage management (`StorageService`), language preferences (`LanguageService`),
 * and navigation (`Router`). It also utilizes Angular Material components for its UI.
 * The component's behavior and displayed actions can be customized through its input properties.
 * It emits events to notify parent components of actions like task generation or deletion.
 */
// Angular Core and Common
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Third-party Libraries
import { io, Socket as SocketIoClientSocket } from 'socket.io-client';

// Application-specific Services and Models
import { GenkitService, Idea, GenerateTasksRequestData, ScoreIdeaRequestData, OperationRequestData } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';

// Environment
import { environment } from '../../environments/environment';

/**
 * Defines the structure of the data emitted by the `tasksOn` event.
 * This interface is used when the component emits an event related to tasks,
 * bundling the tasks themselves with the associated idea.
 */
export interface CardIdeaEmitData {
  /**
   * An object containing an array of task strings.
   * The structure `{ text: string[] }` is used to align with how tasks might be stored or processed.
   */
  tasks: { text: string[] };
  /**
   * The idea object to which these tasks pertain.
   * @type {Idea}
   */
  idea: Idea;
}

/**
 * A standalone component that displays an individual idea in a card format.
 *
 * It provides various interactive elements such as buttons for scoring the idea,
 * generating tasks, performing operations (like combining), sharing, deleting,
 * and adding the idea. The component's appearance and available actions
 * are configurable through its input properties. It also emits events for
 * certain actions to communicate with parent components.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-card-idea' - The HTML tag used to embed this component.
 *  - `standalone`: true - Indicates that this is a standalone component.
 *  - `imports`: An array of modules and components required by this component:
 *    - `CommonModule`: Provides common Angular directives like `*ngIf`, `*ngFor`.
 *    - `MatCardModule`: For styling the card container.
 *    - `MatProgressSpinnerModule`: For displaying a loading indicator.
 *    - `MatButtonModule`: For themed buttons.
 *    - `MatSnackBarModule`: For displaying snack bar notifications (though not explicitly used in the provided code, its import suggests potential usage).
 *    - `MatIconModule`: For using Material icons.
 *    - `MatTooltipModule`: For displaying tooltips on elements.
 *  - `templateUrl`: './card-idea.component.html' - Path to the component's HTML template.
 *  - `styleUrls`: ['./card-idea.component.sass'] - Path to the component's Sass stylesheet(s).
 *
 * Implements:
 *  - `OnInit`: Lifecycle hook for initialization logic.
 *  - `OnChanges`: Lifecycle hook to respond when Angular sets or resets data-bound input properties.
 *  - `OnDestroy`: Lifecycle hook for cleanup logic.
 */
@Component({
  selector: 'app-card-idea',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './card-idea.component.html',
  styleUrls: ['./card-idea.component.sass']
})
export class CardIdeaComponent implements OnInit, OnChanges, OnDestroy {

  /** The idea object to display. Can be null if no idea is provided or loaded. */
  @Input() idea: Idea | null = null;
  /** Whether to display action buttons (like score, tasks, etc.). Defaults to true. */
  @Input() showActions: boolean = true;
  /** UUID of the idea, used for loading if the `idea` object is not directly provided. */
  @Input() ideaUuid: string | null = null;
  /** If true, triggers an automatic evaluation of the idea's score on initialization or change. */
  @Input() evaluateScore: boolean = false;
  /** Controls the visibility of the 'generate tasks' button. */
  @Input() tasksButton = false;
  /** Controls the visibility of the 'share idea' button. */
  @Input() sharedButton = false;
  /** Controls the visibility of the 'documents' button (purpose might be specific to parent component). */
  @Input() documentsButton = false;
  /** Controls the visibility of the 'fusion' or 'operation' button. */
  @Input() fusionButton = false;
  /** Controls the visibility of the 'delete' button. Defaults to true. */
  @Input() trashButton = true;
  /** Controls the visibility of an 'add idea' button. Defaults to false. */
  @Input() addIdeaButton : boolean | null = false;

  /** Emits task data along with the idea when tasks are generated or retrieved. */
  @Output() tasksOn = new EventEmitter<CardIdeaEmitData>();
  /** Emits the idea object, possibly when a 'documents' action is triggered. */
  @Output() documentsOn = new EventEmitter<Idea>();
  /** Emits the UUID of the idea when it is deleted. */
  @Output() isDeleted = new EventEmitter<string>();

  /** Stores the numerical score of the idea after evaluation. Null if not scored. */
  ideaScore: number | null = null;
  /** Flag indicating if the idea scoring process is currently active. */
  isScoring: boolean = false;
  /** Flag indicating if the component is currently loading initial idea data. */
  isLoading: boolean = true;
  /** Flag indicating if task generation for the idea is currently in progress. */
  isGeneratingTasks: boolean = false;
  /** Flag indicating if an idea operation (e.g., combining) is in progress. */
  isOperating: boolean = false;
  /** Stores data for an ongoing operation, typically the first idea selected for a two-idea operation. */
  operationData: Idea | null = null;
  /** Flag indicating if the current idea is mergiable with an idea stored for operation. True if no operation is pending or if the stored idea is different. */
  mergiable: boolean = true;

  /** Private instance of the Socket.IO client for real-time communication (e.g., sharing). */
  private socket: SocketIoClientSocket;

  /**
   * Constructs the CardIdeaComponent.
   * Initializes the Socket.IO client and injects necessary services.
   * @param {StorageService} storageService - Service for local storage operations.
   * @param {Router} router - Angular's Router service for navigation.
   * @param {GenkitService} genkitService - Service for interacting with Genkit backend flows.
   * @param {LanguageService} languageService - Service for managing language preferences.
   */
  constructor(
    private storageService: StorageService,
    private router: Router,
    private genkitService: GenkitService,
    private languageService: LanguageService,
  ) {
    this.socket = io(environment.socketAddr, {
      transports: ['websocket']
    });
  }

  /**
   * Checks the storage for an existing 'operation' idea and updates the `mergiable`
   * status of the current idea. If the current idea is already stored for an operation,
   * it's not mergiable with itself.
   * @private
   * @async
   */
  private async checkOperationState(): Promise<void> {
    if (!this.idea || !this.idea.id) return;

    try {
      const operationKey = 'operation';
      const existingOperationData = await this.storageService.getItem<Idea>(operationKey);
      if (existingOperationData && existingOperationData.id === this.idea.id) {
        this.mergiable = false;
      }
    } catch (error) {
      console.error(`CardIdeaComponent: Error checking operation state in storage:`, error);
    }
  }

  /**
   * Clears any idea stored for an ongoing operation from local storage,
   * effectively resetting the operation state and making the current idea mergiable again.
   * @async
   */
  async clearOperation(): Promise<void> {
    this.storageService.removeItem('operation');
    this.mergiable = true;
  }

  /**
   * Handles the 'operation' (e.g., combine/fusion) action for the current idea.
   * If no idea is stored for operation, it stores the current idea.
   * If an idea is already stored and it's different from the current idea,
   * it calls the Genkit service to perform a "Combine" operation, creates a new idea
   * from the result, stores it, clears the operation state, and navigates to the new idea's job card.
   * @async
   */
  async operation(): Promise<void> {
    if (!this.idea) {
      console.error('Cannot perform operation: Current idea is missing.');
      return;
    }

    const operationKey = 'operation';
    this.isOperating = true;

    try {
      const existingOperationData = await this.storageService.getItem<Idea>(operationKey);

      if (!existingOperationData) {
        await this.storageService.setItem(operationKey, this.idea);
        this.mergiable = false;
      } else if (existingOperationData && existingOperationData.id && existingOperationData.id !== this.idea.id) {
        const requestData : OperationRequestData = {
          idea1: existingOperationData.text,
          idea2: this.idea.text,
          operation: "Combine",
          language: this.languageService.getCurrentLanguageBackendName()
        };

        this.genkitService.callOperation(requestData, true).subscribe({
          next: async (newIdeaText: string) => {
            const newIdeaUuid = crypto.randomUUID();
            const newIdea = await this.createIdea(newIdeaUuid,newIdeaText,requestData.language);
            await this.storageService.setItem(newIdeaUuid, newIdea);
            await this.storageService.removeItem(operationKey);
            this.router.navigate(['/jobcard', newIdeaUuid]);
          },
          error: (error) => {
            console.error('Error during idea operation:', error);
            this.isOperating = false;
          }
        });
      } else { // existingOperationData.id === this.idea.id
        this.mergiable = false; // Already stored for operation, do nothing further
      }
    } catch (error) {
      console.error(`Error accessing or setting storage for key '${operationKey}':`, error);
      this.isOperating = false; // Ensure loading state is reset on error
    }
    // Note: isOperating might need to be reset in the next block for non-Combine scenarios or if mergiable becomes false.
    // For now, it's reset on error and implicitly after navigation in the success case.
  }

  /**
   * Shares the current idea's text via Socket.IO.
   * Sets `sharedButton` to false after attempting to share, likely to change button state.
   * @param {Idea} cardIdea - The idea object to be shared.
   * @async
   */
  async shareCurrentIdea(cardIdea: Idea): Promise<void> {
    this.sharedButton = false; // Intended to disable button after click? Or UI feedback?

    if (cardIdea && cardIdea.text) {
      const payload = { text: cardIdea.text };
      this.socket.emit('idea', payload);
    } else {
      console.warn('No text to share.');
    }
  }

  /**
   * Emits the current idea through the `documentsOn` EventEmitter.
   * This is likely used to signal a parent component to handle document-related actions for this idea.
   * @param {Idea} idea - The idea object to emit.
   * @async
   */
  async documentsEmiter(idea: Idea): Promise<void> {
    this.documentsOn.emit(idea);
  }

  /**
   * Handles the 'generate tasks' action for the current idea.
   * If tasks for the idea exist in local storage, it emits them.
   * Otherwise, it calls the Genkit service to generate tasks, stores them, and then emits them.
   * Skips generation if an operation is already in progress.
   * @param {Idea} idea - The idea for which to generate or retrieve tasks.
   * @async
   */
  async tasksEmiter(idea: Idea): Promise<void> {
    if (this.isOperating) {
      console.log("Operation in progress, tasks generation skipped.");
      return;
    }
    if (!idea || !idea.id) {
      console.error('Cannot check/generate tasks: Idea or idea ID is missing.');
      return;
    }

    const tasksKey = `tasks_${idea.id}`;

    try {
      const existingTasks = await this.storageService.getItem<{ text: string[] }>(tasksKey);

      if (existingTasks) {
        this.tasksOn.emit({ tasks: existingTasks, idea: idea });
        return;
      }

      if (!idea.text) {
        console.error('Cannot generate tasks: Idea text is missing.');
        return;
      }

      this.isGeneratingTasks = true;
      const language = this.languageService.getCurrentLanguageBackendName();
      const requestData: GenerateTasksRequestData = { idea: idea.text, language: language };
      this.genkitService.callGenerateTasks(requestData, false).subscribe({
        next: (tasksResult: any) => { // tasksResult is expected to be string[]
          const tasksToStore = { text: tasksResult as string[] };
          this.storageService.setItem(tasksKey, tasksToStore)
            .then(() => {
              this.tasksOn.emit({ tasks: tasksToStore, idea: idea });
            })
            .catch(saveError => {
              console.error(`Error saving generated tasks with key ${tasksKey}:`, saveError);
            })
            .finally(() => {
              this.isGeneratingTasks = false;
            });
        },
        error: (error) // Added error parameter
        ) => {
          console.error('Error generating tasks:', error); // Log the error
          this.isGeneratingTasks = false;
        }
      });

    } catch (storageError) {
      console.error(`Error accessing storage for key ${tasksKey}:`, storageError);
      this.isGeneratingTasks = false;
    }
  }

  /**
   * Creates an `Idea` object.
   * @param {string} uuid - The unique identifier for the idea.
   * @param {string} text - The text content of the idea.
   * @param {string} [language] - The optional language of the idea.
   * @returns {Promise<Idea>} A promise that resolves to the created Idea object.
   * @async
   */
  async createIdea(uuid: string,text: string, language?: string): Promise<Idea> {
    const newIdea: Idea = {
      id: uuid,
      text: text,
      language: language
    };
    return newIdea;
  }

  /**
   * Deletes an idea and its associated tasks from local storage.
   * Emits the UUID of the deleted idea through the `isDeleted` EventEmitter.
   * @param {string} uuid - The UUID of the idea to delete.
   * @async
   */
  async deleteIdea(uuid: string): Promise<void> {
    if (!uuid) {
      console.error('Cannot delete: Idea UUID is missing.');
      return;
    }

    const tasksKey = `tasks_${uuid}`;

    try {
      await Promise.all([
        this.storageService.removeItem(uuid),
        this.storageService.removeItem(tasksKey)
      ]);
      this.isDeleted.emit(uuid);
    } catch (error) {
      console.error(`Error deleting idea with uuid ${uuid} or its tasks:`, error);
    }
  }

  /**
   * Adds a given idea to local storage with a new UUID.
   * Sets `addIdeaButton` to false, possibly to change UI state after adding.
   * @param {Idea} idea - The idea object to add.
   */
  addIdea(idea: Idea){
    const newIdeaUuid = crypto.randomUUID();
    this.storageService.setItem(newIdeaUuid, idea);
    this.addIdeaButton = false;
  }

  /**
   * Angular lifecycle hook that responds when Angular sets or resets data-bound input properties.
   * If `evaluateScore` input changes to true and an idea is present, it triggers score evaluation.
   * @param {SimpleChanges} changes - An object describing which input properties have changed.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaluateScore'] && changes['evaluateScore'].currentValue === true && this.idea) {
      this.evaluateIdeaScore(this.idea);
    }
  }

  /**
   * Angular lifecycle hook called after component initialization.
   * Sets initial loading state. If an `idea` object is already provided via input,
   * it proceeds to evaluate its score (if `evaluateScore` is true) and check its operation state.
   * If only `ideaUuid` is provided, it attempts to load the idea data.
   */
  ngOnInit(): void {
    this.isLoading = true; // Initial assumption

    if (this.idea) {
      this.isLoading = false; // Idea already provided
      if (this.evaluateScore) {
        this.evaluateIdeaScore(this.idea);
      }
      this.checkOperationState();
      return;
    }

    if (this.ideaUuid) {
      this.loadIdeaData(this.ideaUuid);
    } else {
      this.isLoading = false; // No idea or UUID to load
    }
  }

  /**
   * Loads idea data from storage using the provided UUID.
   * Updates the component's `idea` property and then evaluates its score if required.
   * Manages loading state during the operation.
   * @private
   * @param {string} uuid - The UUID of the idea to load.
   * @async
   */
  private async loadIdeaData(uuid: string): Promise<void> {
    this.isLoading = true;
    try {
      const ideaFromStorage = await this.storageService.getItem<Idea>(uuid); // Changed variable name
      if(ideaFromStorage){ // Check if ideaFromStorage is not null
        ideaFromStorage.id = uuid; // Assign id if not already present
        this.idea = ideaFromStorage;
        if (this.evaluateScore) {
          this.evaluateIdeaScore(this.idea);
        }
        await this.checkOperationState(); // Ensure this is awaited if it's async
      } else {
        console.warn(`No idea found in storage for UUID: ${uuid}`);
        // Optionally set this.idea to null or handle as an error
        this.idea = null;
      }
    } catch (error) { // Catch potential errors from getItem or subsequent calls
        console.error(`Error loading idea data for UUID ${uuid}:`, error);
        this.idea = null; // Ensure idea is null on error
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Calls the Genkit service to evaluate the score of the provided idea.
   * Updates `ideaScore` and manages `isScoring` state.
   * @private
   * @param {Idea} idea - The idea to score.
   */
  private evaluateIdeaScore(idea: Idea): void {
    if (!idea || !idea.text) {
      console.error('Cannot evaluate score: Idea or idea text is missing.');
      return;
    }

    this.isScoring = true;
    this.ideaScore = null;
    const requestData: ScoreIdeaRequestData = { idea: idea.text };

    this.genkitService.callScoreIdea(requestData, false, true).subscribe({
      next: (scoreResult: number) => {
        if (scoreResult && typeof scoreResult === 'number') { // Check if scoreResult is a valid number
          this.ideaScore = scoreResult;
        } else {
          // console.warn('Received invalid score result:', scoreResult); // Log unexpected result
          this.ideaScore = null; // Set to null if not valid
        }
        this.isScoring = false;
      },
      error: (error) => { // Added error parameter
        console.error('Error scoring idea:', error); // Log the error
        this.isScoring = false;
        this.ideaScore = null; // Ensure score is null on error
      }
    });
  }

  /**
   * Determines the CSS class for displaying the idea score based on its value.
   * @param {(number | null)} score - The numerical score of the idea.
   * @returns {string} The CSS class string ('score-low', 'score-medium', 'score-high', or '').
   */
  getScoreColorClass(score: number | null): string {
    if (score === null) {
      return '';
    }
    if (score >= 1 && score <= 3) {
      return 'score-low';
    } else if (score >= 4 && score <= 7) {
      return 'score-medium';
    } else if (score >= 8 && score <= 10) {
      return 'score-high';
    }
    return '';
  }

  /**
   * Angular lifecycle hook called just before the component is destroyed.
   * Disconnects the Socket.IO client to prevent memory leaks and lingering connections.
   */
  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
