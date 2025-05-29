/**
 * @fileoverview Defines the `JobcardComponent` for the Angular web application.
 *
 * This component serves as the detailed view for an individual "idea" or "job card".
 * It is typically navigated to with a UUID in the route parameters, which is used
 * to identify the specific idea. The component is responsible for:
 *  - Displaying the main idea content (potentially via a child `CardIdeaComponent`).
 *  - Managing and displaying a list of tasks associated with the idea.
 *  - Allowing users to select tasks and get detailed help or "zoom in" on a task,
 *    fetching this detailed information from a backend service (`GenkitService`).
 *  - Enabling users to discard tasks, which updates the task list and potentially
 *    saves the changes.
 *  - Providing functionality to save the "zoomed-in" task help content as a new
 *    document associated with the idea in local storage.
 *  - Managing and displaying these saved documents.
 *  - Offering text-to-speech playback for task details using `TextToSpeechService`.
 *  - Interacting with `StorageService` for persisting and retrieving idea data,
 *    tasks, and documents.
 *  - Subscribing to online status updates via `OnlineStatusService`.
 *  - Handling UI states for loading, errors, and interactions.
 */ 
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { signal } from '@angular/core';
// Application-specific Components
import { CardIdeaComponent, CardIdeaEmitData } from '../card-idea/card-idea.component';

// Application-specific Services and Models
import { Idea, IdeaDocument, GenkitService, DiscardTasksRequestData, HelpTaskRequestData } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';
import { TexttospeechService } from '../services/texttospeech.service';
import { OnlineStatusService } from '../services/onlinestatus.service';

/**
 * Interface for displaying a task's title and its detailed text.
 * This structure is used, for example, when a task's help content is fetched
 * and prepared for display or saving as a document.
 */
export interface TaskDisplayDocument {
  /** The title of the task, which might be optional if the context implies it. */
  title?: string;
  /** The detailed text content associated with the task or its help information. */
  text: string;
}

/**
 * Component responsible for displaying the detailed view of a specific idea or "job card".
 *
 * It loads idea data based on a UUID route parameter and presents the idea's details,
 * associated tasks, and documents. Users can interact with tasks by getting detailed help
 * (which can then be saved as a document), discarding tasks, and navigating between tasks.
 * It also provides text-to-speech functionality for task content.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-jobcard' - The HTML tag used to embed this component.
 *  - `standalone`: true - Indicates that this is a standalone component.
 *  - `imports`: An array of modules and components required by this component:
 *    - `CommonModule`: Provides common Angular directives.
 *    - `FormsModule`: For handling form inputs (though not explicitly used in complex forms here,
 *      it might be used for simple inputs or future enhancements).
 *    - `MatChipsModule`: For displaying tasks or other items as chips.
 *    - `MatIconModule`: For using Material icons.
 *    - `MatButtonModule`: For Material Design styled buttons.
 *    - `MatProgressSpinnerModule`: For displaying loading indicators.
 *    - `MatButtonToggleModule`: For button toggle groups, potentially for task selection modes.
 *    - `MatExpansionModule`: For creating expandable panels, e.g., for displaying task details or documents.
 *    - `CardIdeaComponent`: A child component used to display the main idea card.
 *  - `templateUrl`: './jobcard.component.html' - Path to the component's HTML template.
 *  - `styleUrls`: ['./jobcard.component.sass'] - Path to the component's Sass stylesheet(s).
 *
 * Implements:
 *  - `OnInit`: Lifecycle hook for initialization logic, such as retrieving the route parameter.
 *  - `OnDestroy`: Lifecycle hook for cleanup logic, such as stopping text-to-speech.
 */
@Component({
  selector: 'app-jobcard',
  templateUrl: './jobcard.component.html',
  styleUrls: ['./jobcard.component.sass'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatExpansionModule,
    CardIdeaComponent
  ]
})
export class JobcardComponent implements OnInit, OnDestroy {

  // Observables
  /** Observable that emits the current online status of the application. Readonly for template binding. */
  public readonly isOnline$: Observable<boolean>;
  
  // Component State
  /** The UUID of the current idea/job card, retrieved from route parameters. */
  public ideaid: string | null = null;
  /** The current idea object being displayed and interacted with. */
  public currentIdea = signal<Idea | null>(null);
  /** Array of task strings associated with the `currentIdea`. */
  public tasks = signal<string[] | null>(null);
  /** Array of tasks currently selected by the user, typically for actions like 'discard' or 'help'. */
  public selectedTasks = signal<string[]>([]);
  /** Array of documents associated with the `currentIdea`. */
  public documents = signal<IdeaDocument[] | null>([]);
  /** Stores the result of a "zoomed-in" or "helped" task, ready for display or saving. */
  public zoomedTaskResult = signal<TaskDisplayDocument | null>(null);

  // UI State
  /** Flag indicating if the "discard tasks" operation is currently in progress. */
  public isDiscarding: boolean = false;
  /** Stores an error message string to be displayed in the UI if an error occurs. */
  public errorMessage: string | null = null;

  /**
   * Constructs the JobcardComponent.
   * Injects necessary services for routing, viewport scrolling, backend interaction,
   * language preferences, local storage, text-to-speech, and online status monitoring.
   * Initializes the `isOnline$` observable.
   *
   * @param {ActivatedRoute} route - Service to access route parameters.
   * @param {Router} router - Angular's Router service for navigation.
   * @param {ViewportScroller} viewportScroller - Service to control viewport scrolling.
   * @param {GenkitService} genkitService - Service for backend Genkit flow calls.
   * @param {LanguageService} languageService - Service for language settings.
   * @param {StorageService} storageService - Service for local storage operations.
   * @param {TexttospeechService} textToSpeechService - Service for text-to-speech functionality.
   * @param {OnlineStatusService} networkStatusService - Service to monitor network online status.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viewportScroller: ViewportScroller,
    private genkitService: GenkitService,
    private languageService: LanguageService,
    private storageService: StorageService,
    private textToSpeechService: TexttospeechService,
    private networkStatusService: OnlineStatusService
  ) {
    this.isOnline$ = this.networkStatusService.isOnline$;
  }

  /**
   * Angular lifecycle hook called after component initialization.
   * Retrieves the 'uuid' route parameter to set the `ideaid` for the current job card.
   * Note: Actual data loading for the idea based on this ID is typically handled
   * by child components (e.g., `CardIdeaComponent` via its inputs) or other method calls.
   */
  ngOnInit(): void {
    this.ideaid = this.route.snapshot.paramMap.get('uuid');
    // Initial data loading for `currentIdea` and `tasks` is often triggered
    // by inputs to child CardIdeaComponent or direct calls if not passed down.
    // This ngOnInit primarily sets up the ideaid.
  }

  /**
   * Angular lifecycle hook called just before the component is destroyed.
   * Stops any ongoing text-to-speech playback to prevent audio from continuing
   * after the component is removed from the view.
   */
  ngOnDestroy(): void {
    // console.log('JobcardComponent: Destroyed. Stopping any ongoing playback.');
    this.textToSpeechService.stop();
  }

  // Data Input from Child Components
  /**
   * Callback method to handle an idea object emitted from a child component (e.g., `CardIdeaComponent`),
   * typically when documents related to that idea need to be shown or updated.
   * Sets the `currentIdea` and updates the local `documents` list from the idea.
   * @param {Idea} idea - The idea object emitted from the child component.
   */
  public showDocuments(idea: Idea): void {
    // console.log('Received an idea from CardIdeaComponent (showDocuments)');
    if (idea) { 
      this.currentIdea.set(idea);
      this.documents.set(idea.documents || []);
    } 
  }

  /**
   * Callback method to handle task data emitted from a child component (e.g., `CardIdeaComponent`).
   * Sets the `currentIdea`, associated `documents`, and the `tasks` list.
   * Clears any existing error messages.
   * @param {CardIdeaEmitData} tasksAndIdea - An object containing the tasks and the associated idea.
   */
  public showTasks(tasksAndIdea: CardIdeaEmitData): void {
    // console.log('Received data in Jobcard (showTasks):', tasksAndIdea);
    this.errorMessage = null; // This can remain a direct property if only used for one-time display
    this.currentIdea.set(tasksAndIdea.idea);
    this.documents.set(this.currentIdea()?.documents || []);

    if (tasksAndIdea.tasks && Array.isArray(tasksAndIdea.tasks.text)) {
      this.tasks.set(tasksAndIdea.tasks.text);
      // console.log('Tasks updated:', this.tasks);
    } else {
      // console.warn('Received tasks data is not in the expected format { text: string[] } or is missing. Data:', tasksAndIdea.tasks);
      this.tasks.set(null);
    }
  }

  // Task Selection and Manipulation
  /**
   * Moves a specified task from the main `tasks` list to the `selectedTasks` list (tasks to be discarded).
   * If the task is not already in `selectedTasks`, it's added.
   * @param {string} taskToDiscard - The task string to be moved to the discard list.
   */
  public addTaskToDiscard(taskToDiscard: string): void {
    const currentTasks = this.tasks();
    if (currentTasks && currentTasks.includes(taskToDiscard)) {
      this.tasks.set(currentTasks.filter(task => task !== taskToDiscard));
      this.selectedTasks.update(currentSelected => {
        if (!currentSelected.includes(taskToDiscard)) {
          return [...currentSelected, taskToDiscard];
        }
        return currentSelected;
      });
      // console.log('Task moved to discard:', taskToDiscard);
      // console.log('Current tasks:', this.tasks);
      // console.log('Discarded tasks:', this.selectedTasks);
    }
  }
  /**
   * Clears all tasks from the `selectedTasks` list.
   */
  public deselectAllTasks(): void {
    this.selectedTasks.set([]);
    // console.log('All tasks deselected.');
  }

  /**
   * Selects the next task in the `tasks` list for focused interaction (e.g., getting help).
   * If at the end of the list, it wraps around to the first task.
   * After selecting, it automatically calls `helpTask()` for the newly selected task.
   * Handles cases with few or no tasks.
   */
  public selectNextTask(): void {
    const currentTasks = this.tasks();
    if (!currentTasks || currentTasks.length < 1) {
      // console.warn("Cannot select next task: Not enough tasks available or tasks not loaded.");
      return;
    }
    // If only one task and it's already selected (or becomes selected), re-trigger help for it.
    if (currentTasks.length === 1) {
        this.selectedTasks.set([currentTasks[0]]);
        this.helpTask();
        return;
    }

    const currentSelected = this.selectedTasks();
    const currentTask = currentSelected.length > 0 ? currentSelected[0] : null;
    const currentIndex = currentTask ? currentTasks.indexOf(currentTask) : -1; // Start before first if none selected
    const nextIndex = (currentIndex + 1) % currentTasks.length;

    this.selectedTasks.set([currentTasks[nextIndex]]);
    // console.log("Selected next task:", this.selectedTasks[0]);
    this.helpTask();
  }

  /**
   * Selects the previous task in the `tasks` list for focused interaction.
   * If at the beginning of the list, it wraps around to the last task.
   * After selecting, it automatically calls `helpTask()` for the newly selected task.
   * Handles cases with few or no tasks.
   */
  public selectPreviousTask(): void {
    const currentTasks = this.tasks();
    if (!currentTasks || currentTasks.length < 1) {
      // console.warn("Cannot select previous task: Not enough tasks available or tasks not loaded.");
      return;
    }
    // If only one task and it's already selected (or becomes selected), re-trigger help for it.
    if (currentTasks.length === 1) {
        this.selectedTasks.set([currentTasks[0]]);
        this.helpTask();
        return;
    }

    const currentSelected = this.selectedTasks();
    const currentTask = currentSelected.length > 0 ? currentSelected[0] : null;
    const currentIndex = currentTask ? currentTasks.indexOf(currentTask) : 0; // Default to 0 to cycle correctly
    const previousIndex = (currentIndex - 1 + currentTasks.length) % currentTasks.length;

    this.selectedTasks.set([currentTasks[previousIndex]]);
    // console.log("Selected previous task:", this.selectedTasks[0]);
    this.helpTask();
  }

  // Core Task Actions (API Calls)
  /**
   * Fetches detailed help information for the currently selected task (the first task in `selectedTasks`).
   * Calls the `genkitService.callHelpTask` and updates `zoomedTaskResult` with the response.
   * Scrolls to the 'document' anchor after fetching help.
   * Manages error state via `errorMessage`.
   */
  public helpTask(): void {
    this.errorMessage = null; // Can remain direct property
    this.zoomedTaskResult.set(null);

    const idea = this.currentIdea();
    if (!idea?.text) {
      this.errorMessage = 'Idea information is missing.';
      // console.error(this.errorMessage);
      return;
    }
    const currentSelectedTasks = this.selectedTasks();
    if (currentSelectedTasks.length === 0) {
      this.errorMessage = 'No task selected to get help for.';
      // console.warn(this.errorMessage);
      return;
    }

    const taskToZoom = currentSelectedTasks[0];
    const language = this.languageService.getCurrentLanguageBackendName();

    const requestData: HelpTaskRequestData = {
      idea: idea.text,
      task: taskToZoom,
      language: language
    };

    // console.log('Calling callHelpTask with data:', requestData);
    this.genkitService.callHelpTask(requestData, false).subscribe({
      next: (result: string) => { 
        this.zoomedTaskResult.set({ title: taskToZoom, text: result });
        this.scrollToDocumentAnchor();
      },
      error: (error) => {
        console.error('Error calling callHelpTask:', error);
        this.errorMessage = `Error zooming into task: ${error.message || 'Unknown error'}`;
      }
    });
  }

  /**
   * Discards the tasks currently in `selectedTasks` by calling `genkitService.callDiscardTasks`.
   * The service is expected to return an updated list of tasks (without the discarded ones).
   * This updated list replaces the current `tasks`, `selectedTasks` is cleared,
   * and `zoomedTaskResult` is cleared. The new task list is also saved to local storage.
   * Manages `isDiscarding` and `errorMessage` states.
   */
  public discardTask(): void {
    this.errorMessage = null; // Can remain direct property
    const idea = this.currentIdea();
    if (!idea?.text) {
      this.errorMessage = 'Idea information is missing.';
      // console.error(this.errorMessage);
      return;
    }
    const currentTasks = this.tasks();
    if (!currentTasks) { // Check if tasks is null or empty
      this.errorMessage = 'Current tasks list is missing or empty.';
      // console.error(this.errorMessage);
      return;
    }
    const currentSelectedTasks = this.selectedTasks();
    if (currentSelectedTasks.length === 0) {
      this.errorMessage = 'No tasks selected for discarding.';
      // console.warn(this.errorMessage);
      return;
    }

    this.isDiscarding = true; // Can remain direct property if only for template *ngIf
    const language = this.languageService.getCurrentLanguageBackendName();

    const requestData: DiscardTasksRequestData = {
      idea: idea.text,
      tasks: currentTasks.join('\n'),
      tasksdiscard: currentSelectedTasks.join('\n'),
      language: language
    };

    // console.log('Calling callDiscardTasks with data:', requestData);
    this.genkitService.callDiscardTasks(requestData).subscribe({
      next: (updatedTasks: string[]) => {
        this.tasks.set(updatedTasks);
        this.selectedTasks.set([]);
        this.zoomedTaskResult.set(null);

        const storageKey = `tasks_${this.ideaid}`;
        // console.log(`Attempting to save updated tasks to storage with key: ${storageKey}`);
        this.storageService.setItem(storageKey, { text: updatedTasks }) // Save in {text: string[]} format
          .then(() => {} /* console.log('Updated tasks saved successfully to storage.') */)
          .catch(saveError => {
            console.error(`Error saving updated tasks with key ${storageKey}:`, saveError);
            this.errorMessage = `Error saving updated tasks: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`;
          })
          .finally(() => this.isDiscarding = false);
      },
      error: (error) => {
        console.error('Error calling callDiscardTasks:', error);
        this.errorMessage = `Error discarding tasks: ${error.message || 'Unknown error'}`;
        this.isDiscarding = false;
      }
    });
  }

  // Document Management
  /**
   * Saves the content of `zoomedTaskResult` (typically help text for a selected task)
   * as a new document associated with the `currentIdea`.
   * The document is added to the `documents` array of the `currentIdea` object in local storage.
   * Requires `ideaid`, `zoomedTaskResult.text`, and a single selected task (for the document title) to be present.
   * @async
   */
  public async saveDocument(): Promise<void> {
    this.errorMessage = null; // Can remain direct property
    if (!this.ideaid) {
      this.errorMessage = 'Error: Idea ID missing. Cannot save document.';
      // console.error(this.errorMessage);
      return;
    }
    const currentZoomedResult = this.zoomedTaskResult();
    if (!currentZoomedResult?.text) {
      this.errorMessage = 'Error: No content to save from the helped task.';
      // console.error(this.errorMessage);
      return;
    }
    const currentSelectedTasks = this.selectedTasks();
    if (!currentSelectedTasks || currentSelectedTasks.length !== 1 || !currentZoomedResult.title) {
      this.errorMessage = 'Error: A single task must be selected and its help result available to save as a document.';
      // console.error(this.errorMessage, 'Selected tasks:', this.selectedTasks, 'Zoomed title:', this.zoomedTaskResult.title);
      return;
    }
    try {
      let idea = await this.storageService.getItem<Idea>(this.ideaid);

      if (!idea) {
        this.errorMessage = `Error: Idea with ID ${this.ideaid} not found. Cannot save document.`;
        // console.error(this.errorMessage);
        return;
      }

      idea.documents = idea.documents || [];

      const newDocument: IdeaDocument = {
        key: crypto.randomUUID(),
        name: currentZoomedResult.title, // Use title from zoomedTaskResult
        content: currentZoomedResult.text,
        createdAt: Date.now()
      };

      idea.documents.push(newDocument);
      await this.storageService.setItem(this.ideaid, idea);

      this.currentIdea.set(idea);
      this.documents.set(idea.documents);
      // console.log('Document saved successfully!', newDocument);
      this.errorMessage = null;

    } catch (error) {
      console.error('Error saving document:', error);
      this.errorMessage = `Error saving document: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Deletes a specified document from the `currentIdea`'s documents list in local storage.
   * Requires `currentIdea`, its `documents` array, and `ideaid` to be present.
   * @param {IdeaDocument} docToDelete - The document object to be deleted.
   * @async
   */
  public async deleteDocument(docToDelete: IdeaDocument): Promise<void> {
    this.errorMessage = null; // Can remain direct property
    const idea = this.currentIdea();
    if (!idea || !idea.documents || !this.ideaid) {
      this.errorMessage = 'Cannot delete document: Current idea, documents, or idea ID is missing.';
      // console.error(this.errorMessage, 'Current Idea:', this.currentIdea, 'Idea ID:', this.ideaid);
      return;
    }

    try {
      const updatedDocuments = idea.documents.filter(doc => doc.key !== docToDelete.key);
      const updatedIdea = { ...idea, documents: updatedDocuments };
      await this.storageService.setItem(this.ideaid, updatedIdea);

      this.currentIdea.set(updatedIdea);
      this.documents.set(updatedDocuments);
      // console.log(`Document with key ${docToDelete.key} deleted successfully.`);
      this.errorMessage = null;
    } catch (error) {
      console.error('Error deleting document:', error);
      this.errorMessage = `Error deleting document: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Audio Playback
  /**
   * Plays the text content of the provided `TaskDisplayDocument` using `TextToSpeechService`.
   * If audio is already playing, it stops the current playback.
   * Text is cleaned of markdown characters ('#', '*') before speaking.
   * Uses the current language setting for speech synthesis.
   * @param {TaskDisplayDocument} document - The document containing the text to be spoken.
   */
  public playTask(document: TaskDisplayDocument): void {
    if (this.textToSpeechService.isSpeaking()) {
      this.textToSpeechService.stop();
      return;
    }

    if (document?.text) {
      const textToSpeak = document.text.replace(/[#*]/g, ''); // Basic cleaning
      if (textToSpeak.trim()) {
        const lang = this.languageService.getCurrentLanguageBcp47Tag();
        // console.log(`JobcardComponent: Attempting to speak task in ${lang}: "${textToSpeak.substring(0, 50)}..."`);
        this.textToSpeechService.speak(textToSpeak, lang);
      } else {
        // console.warn('JobcardComponent: No text content to speak after cleaning.');
      }
    } else {
      // console.warn('JobcardComponent: No task document available to play.');
    }
  }

  /**
   * Stops any ongoing text-to-speech playback via `TextToSpeechService`.
   */
  public stopPlayback(): void {
    // console.log('JobcardComponent: Stopping playback.');
    this.textToSpeechService.stop();
  }

  // Navigation
  /**
   * Navigates the user to the '/list' page.
   * This method might be used as a general "go back" or "finish" action.
   */
  public updateCardIdea(): void {
    this.router.navigate(['/list']);
  }

  // Private Helper Methods
  /**
   * Scrolls the viewport to an HTML element with the ID 'document'.
   * Uses `requestAnimationFrame` to ensure scrolling happens after DOM updates.
   * @private
   */
  private scrollToDocumentAnchor(): void {
    requestAnimationFrame(() => {
      const targetElement = document.getElementById('document');
      if (targetElement) {
        // console.log('Scrolling to anchor "document".');
        this.viewportScroller.scrollToAnchor('document');
      } else {
        // console.warn('Anchor "document" not found in the DOM. Cannot scroll.');
      }
    });
  }
}