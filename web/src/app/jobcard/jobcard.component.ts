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
 */
export interface TaskDisplayDocument {
  title?: string;
  text: string;
}

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
  public readonly isOnline$: Observable<boolean>;

  // Component State
  public ideaid: string | null = null;
  public currentIdea: Idea | null = null;
  public tasks: string[] | null = null;
  public selectedTasks: string[] = [];
  public documents: IdeaDocument[] | null = []; // Assuming this should reflect currentIdea.documents
  public zoomedTaskResult: TaskDisplayDocument | null = null;

  // UI State
  public isDiscarding: boolean = false;
  public errorMessage: string | null = null;

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

  ngOnInit(): void {
    this.ideaid = this.route.snapshot.paramMap.get('uuid');
    // Potentially load initial idea data here if needed, based on ideaid
  }

  ngOnDestroy(): void {
    console.log('JobcardComponent: Destroyed. Stopping any ongoing playback.');
    this.textToSpeechService.stop();
  }

  // Data Input from Child Components
  public showDocuments(idea: Idea): void {
    console.log('Received an idea from CardIdeaComponent (showDocuments)');
    if (idea) {
      this.currentIdea = idea;
      this.documents = idea.documents || []; // Update local documents based on the idea
    }
  }

  public showTasks(tasksAndIdea: CardIdeaEmitData): void {
    console.log('Received data in Jobcard (showTasks):', tasksAndIdea);
    this.errorMessage = null;
    this.currentIdea = tasksAndIdea.idea;
    this.documents = this.currentIdea?.documents || []; // Update documents when idea changes

    if (tasksAndIdea.tasks && Array.isArray(tasksAndIdea.tasks.text)) {
      this.tasks = tasksAndIdea.tasks.text;
      console.log('Tasks updated:', this.tasks);
    } else {
      console.warn('Received tasks data is not in the expected format { text: string[] } or is missing. Data:', tasksAndIdea.tasks);
      this.tasks = null;
    }
  }

  // Task Selection and Manipulation
  public addTaskToDiscard(taskToDiscard: string): void {
    if (this.tasks && this.tasks.includes(taskToDiscard)) {
      this.tasks = this.tasks.filter(task => task !== taskToDiscard);
      if (!this.selectedTasks.includes(taskToDiscard)) {
        this.selectedTasks.push(taskToDiscard);
      }
      console.log('Task moved to discard:', taskToDiscard);
      console.log('Current tasks:', this.tasks);
      console.log('Discarded tasks:', this.selectedTasks);
    }
  }

  public deselectAllTasks(): void {
    this.selectedTasks = [];
    console.log('All tasks deselected.');
  }

  public selectNextTask(): void {
    if (!this.tasks || this.tasks.length < 1) { // Adjusted to allow selection if only 1 task
      console.warn("Cannot select next task: Not enough tasks available or tasks not loaded.");
      return;
    }
    if (this.tasks.length === 1 && this.selectedTasks.length === 1 && this.selectedTasks[0] === this.tasks[0]) {
        // If only one task and it's already selected, re-trigger help for it.
        this.helpTask();
        return;
    }


    const currentTask = this.selectedTasks.length > 0 ? this.selectedTasks[0] : null;
    const currentIndex = currentTask ? this.tasks.indexOf(currentTask) : -1;
    const nextIndex = (currentIndex + 1) % this.tasks.length;

    this.selectedTasks = [this.tasks[nextIndex]];
    console.log("Selected next task:", this.selectedTasks[0]);
    this.helpTask();
  }

  public selectPreviousTask(): void {
    if (!this.tasks || this.tasks.length < 1) { // Adjusted
      console.warn("Cannot select previous task: Not enough tasks available or tasks not loaded.");
      return;
    }
     if (this.tasks.length === 1 && this.selectedTasks.length === 1 && this.selectedTasks[0] === this.tasks[0]) {
        this.helpTask();
        return;
    }

    const currentTask = this.selectedTasks.length > 0 ? this.selectedTasks[0] : null;
    // Default to 0 (first task) if no task is currently selected, to allow cycling from the start
    const currentIndex = currentTask ? this.tasks.indexOf(currentTask) : 0;
    const previousIndex = (currentIndex - 1 + this.tasks.length) % this.tasks.length;

    this.selectedTasks = [this.tasks[previousIndex]];
    console.log("Selected previous task:", this.selectedTasks[0]);
    this.helpTask();
  }

  // Core Task Actions (API Calls)
  public helpTask(): void {
    this.errorMessage = null;
    this.zoomedTaskResult = null;

    if (!this.currentIdea?.text) {
      this.errorMessage = 'Idea information is missing.';
      console.error(this.errorMessage);
      return;
    }
    if (this.selectedTasks.length === 0) {
      this.errorMessage = 'No task selected to get help for.';
      console.warn(this.errorMessage);
      return;
    }

    const taskToZoom = this.selectedTasks[0];
    const language = this.languageService.getCurrentLanguageBackendName();

    const requestData: HelpTaskRequestData = {
      idea: this.currentIdea.text,
      task: taskToZoom,
      language: language
    };

    console.log('Calling callHelpTask with data:', requestData);
    this.genkitService.callHelpTask(requestData, false).subscribe({
      next: (result: string) => {
        console.log('Received zoomed task result.');
        this.zoomedTaskResult = {
          title: taskToZoom,
          text: result
        };
        this.scrollToDocumentAnchor();
      },
      error: (error) => {
        console.error('Error calling callHelpTask:', error);
        this.errorMessage = `Error zooming into task: ${error.message || 'Unknown error'}`;
      }
    });
  }

  public discardTask(): void {
    this.errorMessage = null;
    if (!this.currentIdea?.text) {
      this.errorMessage = 'Idea information is missing.';
      console.error(this.errorMessage);
      return;
    }
    if (!this.tasks) {
      this.errorMessage = 'Current tasks list is missing.';
      console.error(this.errorMessage);
      return;
    }
    if (this.selectedTasks.length === 0) {
      this.errorMessage = 'No tasks selected for discarding.';
      console.warn(this.errorMessage);
      return;
    }

    this.isDiscarding = true;
    const language = this.languageService.getCurrentLanguageBackendName();

    const requestData: DiscardTasksRequestData = {
      idea: this.currentIdea.text,
      tasks: this.tasks.join('\n'), // Send remaining tasks
      tasksdiscard: this.selectedTasks.join('\n'), // Send tasks to be discarded
      language: language
    };

    console.log('Calling callDiscardTasks with data:', requestData);
    this.genkitService.callDiscardTasks(requestData).subscribe({
      next: (updatedTasks: string[]) => {
        console.log('Received updated tasks:', updatedTasks);
        this.tasks = updatedTasks; // Update the main task list
        this.selectedTasks = [];   // Clear selected (discarded) tasks
        this.zoomedTaskResult = null; // Clear any zoomed result from discarded tasks

        const storageKey = `tasks_${this.ideaid}`;
        console.log(`Attempting to save updated tasks to storage with key: ${storageKey}`);
        this.storageService.setItem(storageKey, updatedTasks)
          .then(() => console.log('Updated tasks saved successfully to storage.'))
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
  public async saveDocument(): Promise<void> {
    this.errorMessage = null;
    if (!this.ideaid) {
      this.errorMessage = 'Error: Idea ID missing. Cannot save document.';
      console.error(this.errorMessage);
      return;
    }
    if (!this.zoomedTaskResult?.text) {
      this.errorMessage = 'Error: No content to save from the helped task.';
      console.error(this.errorMessage);
      return;
    }
    if (!this.selectedTasks || this.selectedTasks.length !== 1 || !this.zoomedTaskResult.title) {
      this.errorMessage = 'Error: A single task must be selected and its help result available to save as a document.';
      console.error(this.errorMessage, 'Selected tasks:', this.selectedTasks, 'Zoomed title:', this.zoomedTaskResult.title);
      return;
    }

    try {
      let idea = await this.storageService.getItem<Idea>(this.ideaid);

      if (!idea) {
        this.errorMessage = `Error: Idea with ID ${this.ideaid} not found. Cannot save document.`;
        console.error(this.errorMessage);
        return;
      }

      idea.documents = idea.documents || [];

      const newDocument: IdeaDocument = {
        key: crypto.randomUUID(),
        name: this.zoomedTaskResult.title, // Title comes from the task that was helped
        content: this.zoomedTaskResult.text,
        createdAt: Date.now()
      };

      idea.documents.push(newDocument);
      await this.storageService.setItem(this.ideaid, idea);
      
      this.currentIdea = idea; // Refresh currentIdea
      this.documents = idea.documents; // Refresh documents list
      console.log('Document saved successfully!', newDocument);
      this.errorMessage = null; // Clear any previous error

    } catch (error) {
      console.error('Error saving document:', error);
      this.errorMessage = `Error saving document: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  public async deleteDocument(docToDelete: IdeaDocument): Promise<void> {
    this.errorMessage = null;
    if (!this.currentIdea || !this.currentIdea.documents || !this.ideaid) {
      this.errorMessage = 'Cannot delete document: Current idea, documents, or idea ID is missing.';
      console.error(this.errorMessage, 'Current Idea:', this.currentIdea, 'Idea ID:', this.ideaid);
      return;
    }

    try {
      this.currentIdea.documents = this.currentIdea.documents.filter(doc => doc.key !== docToDelete.key);
      await this.storageService.setItem(this.ideaid, this.currentIdea);

      this.documents = this.currentIdea.documents; // Refresh documents list
      console.log(`Document with key ${docToDelete.key} deleted successfully.`);
      this.errorMessage = null;
    } catch (error) {
      console.error('Error deleting document:', error);
      this.errorMessage = `Error deleting document: ${error instanceof Error ? error.message : 'Unknown error'}`;
      // Optionally, revert optimistic update if needed, though here we rely on storage success
      // For example, by re-fetching the idea or adding the document back if it failed.
    }
  }

  // Audio Playback
  public playTask(document: TaskDisplayDocument): void {
    if (this.textToSpeechService.isSpeaking()) {
      this.textToSpeechService.stop();
      return;
    }

    if (document?.text) {
      const textToSpeak = document.text; // Assuming text is plain text
      if (textToSpeak.trim()) {
        const lang = this.languageService.getCurrentLanguageBcp47Tag();
        console.log(`JobcardComponent: Attempting to speak task in ${lang}: "${textToSpeak.substring(0, 50)}..."`);
        this.textToSpeechService.speak(textToSpeak, lang);
      } else {
        console.warn('JobcardComponent: No text content to speak.');
      }
    } else {
      console.warn('JobcardComponent: No task document available to play.');
    }
  }

  public stopPlayback(): void {
    console.log('JobcardComponent: Stopping playback.');
    this.textToSpeechService.stop();
  }

  // Navigation
  public updateCardIdea(): void {
    // This seems to navigate away, perhaps to refresh or choose another idea
    this.router.navigate(['/list']);
  }

  // Private Helper Methods
  private scrollToDocumentAnchor(): void {
    // Ensure the DOM has updated before trying to scroll
    requestAnimationFrame(() => {
      const targetElement = document.getElementById('document');
      if (targetElement) {
        console.log('Scrolling to anchor "document".');
        this.viewportScroller.scrollToAnchor('document');
      } else {
        console.warn('Anchor "document" not found in the DOM. Cannot scroll.');
      }
    });
  }
}