import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, ViewportScroller } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { Observable } from 'rxjs';

import { CardIdeaComponent, CardIdeaEmitData } from '../card-idea/card-idea.component';
import { Idea, IdeaDocument, GenkitService, DiscardTasksRequestData, HelpTaskRequestData } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';
import { TexttospeechService } from '../services/texttospeech.service';
import { OnlineStatusService } from '../services/onlinestatus.service';

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
    CardIdeaComponent]
})
export class JobcardComponent implements OnInit, OnDestroy {
  isOnline$: Observable<boolean>;
  selectedTasks: string[] = [];
  ideaid: string | null = null;
  tasks: string[] | null = null;
  currentIdea: Idea | null = null;
  isDiscarding: boolean = false;
  documents: IdeaDocument[] | null = [];

  zoomedTaskResult: string | null = null;
  errorMessage: string | null = null;

  constructor(private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    private genkitService: GenkitService,
    private languageService: LanguageService,
    private storageService: StorageService,
    private textToSpeechService: TexttospeechService,
    private networkStatusService: OnlineStatusService,
    private router: Router
  ) {
    this.isOnline$ = this.networkStatusService.isOnline$;
  }

  ngOnInit(): void {
    this.ideaid = this.route.snapshot.paramMap.get('uuid');
  }

  showDocuments(idea: Idea) {
    console.log('Received an idea from CardIdeaComponent');
    if (idea) {
      this.currentIdea = idea;
    }
  }

  showTasks(tasksAndIdea: CardIdeaEmitData): void {
    console.log('Received data in Jobcard:', tasksAndIdea);
    this.errorMessage = null;
    this.currentIdea = tasksAndIdea.idea;
    if (Array.isArray(tasksAndIdea.tasks.text)) {
      this.tasks = tasksAndIdea.tasks.text;
      console.log('Tasks updated:', this.tasks);
    } else {
      console.warn('Received tasks data is not in the expected format { text: string[] } or is missing. Data:', tasksAndIdea.tasks);
      this.tasks = null;
    }
  }

  addTaskToDiscard(taskToDiscard: string): void {
    if (this.tasks && this.tasks.includes(taskToDiscard)) {
      this.tasks = this.tasks.filter(task => task !== taskToDiscard);
      this.selectedTasks.push(taskToDiscard);
      console.log('Task moved to discard:', taskToDiscard);
      console.log('Current tasks:', this.tasks);
      console.log('Discarded tasks:', this.selectedTasks);
    }
  }
  deselectAllTasks() {
    this.selectedTasks = [];
  }

  async deleteDocument(docToDelete: IdeaDocument): Promise<void> {
    if (!this.currentIdea || !this.currentIdea.documents || !this.ideaid) {
      console.log(this.currentIdea)
      console.error('Cannot delete document: Current idea, documents, or idea ID is missing.');
      this.errorMessage = 'Cannot delete document: Essential data is missing.';
      return;
    }

    try {
      // Rimuovi il documento dall'array dei documenti dell'idea corrente
      this.currentIdea.documents = this.currentIdea.documents.filter(doc => doc.key !== docToDelete.key);

      // Aggiorna l'idea nello storage
      await this.storageService.setItem(this.ideaid, this.currentIdea);

      console.log(`Document with key ${docToDelete.key} deleted successfully.`);
      this.errorMessage = null; // Pulisci eventuali messaggi di errore precedenti
    } catch (error) {
      console.error('Error deleting document:', error);
      this.errorMessage = `Error deleting document: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  helpTask(): void {
    this.errorMessage = null;
    this.zoomedTaskResult = null;

    if (!this.currentIdea || !this.currentIdea.text) {
      this.errorMessage = 'Idea information is missing.';
      console.error(this.errorMessage);
      return;
    }

    const taskToZoom = this.selectedTasks[0];
    const language = this.languageService.getCurrentLanguageBackendName();

    const requestData: HelpTaskRequestData = {
      idea: this.currentIdea.text,
      task: taskToZoom,
      language: language
    };
    this.genkitService.callHelpTask(requestData, false).subscribe({
      next: (result: string) => {
        console.log('Received zoomed task result.');
        this.zoomedTaskResult = result;
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
      },
      error: (error) => {
        console.error('Error calling callZoomTask:', error);
        this.errorMessage = `Error zooming into task: ${error.message || 'Unknown error'}`;
      }
    });

  }

  selectNextTask(): void {
    if (!this.tasks || this.tasks.length < 2) {
      console.warn("Cannot select next task: Not enough tasks available.");
      return;
    }

    const currentTask = this.selectedTasks.length > 0 ? this.selectedTasks[0] : null;
    let currentIndex = currentTask ? this.tasks.indexOf(currentTask) : -1;

    let nextIndex = (currentIndex + 1) % this.tasks.length;

    this.selectedTasks = [this.tasks[nextIndex]];
    console.log("Selected next task:", this.selectedTasks[0]);

    this.helpTask();
  }

  selectPreviousTask(): void {
    if (!this.tasks || this.tasks.length < 2) {
      console.warn("Cannot select previous task: Not enough tasks available.");
      return;
    }

    const currentTask = this.selectedTasks.length > 0 ? this.selectedTasks[0] : null;
    let currentIndex = currentTask ? this.tasks.indexOf(currentTask) : 0; // Default to 0 if none selected

    let previousIndex = (currentIndex - 1 + this.tasks.length) % this.tasks.length;

    this.selectedTasks = [this.tasks[previousIndex]];
    console.log("Selected previous task:", this.selectedTasks[0]);

    this.helpTask();
  }

  discardTask(): void {
    this.errorMessage = null;
    if (!this.currentIdea || !this.currentIdea.text) {
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
      tasks: this.tasks.join('\n'),
      tasksdiscard: this.selectedTasks.join('\n'),
      language: language
    };

    console.log('Calling callDiscardTasks with data:', requestData);
    this.genkitService.callDiscardTasks(requestData).subscribe({
      next: (updatedTasks: string[]) => {
        console.log('Received updated tasks:', updatedTasks);

        const tasksToStore = { text: updatedTasks };
        const storageKey = `tasks_${this.ideaid}`;

        console.log(`Attempting to save updated tasks to storage with key: ${storageKey}`);
        this.storageService.setItem(storageKey, updatedTasks)
          .then(() => {
            console.log('Updated tasks saved successfully to storage.');
            this.tasks = updatedTasks;
            this.selectedTasks = [];
          })
          .catch(saveError => {
            console.error(`Error saving updated tasks with key ${storageKey}:`, saveError);
            this.errorMessage = `Error saving updated tasks: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`;
          })
          .finally(() => {
            this.isDiscarding = false;
          });
      },
      error: (error) => {
        console.error('Error calling callDiscardTasks:', error);
        this.errorMessage = `Error discarding tasks: ${error.message || 'Unknown error'}`;
        this.isDiscarding = false;
      }
    });
  }

  updateCardIdea(uuid: string) {
    this.router.navigate(['/list']);
  }

  async saveDocument(): Promise<void> {
    if (!this.ideaid) {
      console.error('Error: Idea ID missing.');
      return;
    }
    if (!this.zoomedTaskResult) {
      console.error('Error: No content to save.');
      return;
    }
    if (!this.selectedTasks || this.selectedTasks.length !== 1) {
      console.error('Error: Select exactly one task to save the result.');
      return;
    }

    const currentTaskName = this.selectedTasks[0];
    try {
      const idea = await this.storageService.getItem<Idea>(this.ideaid);

      if (!idea) {
        console.error(`Error: Idea with ID ${this.ideaid} not found.`);
        return;
      }

      if (!idea.documents) {
        idea.documents = [];
      }

      const newDocument: IdeaDocument = {
        key: crypto.randomUUID(),
        name: currentTaskName,
        content: this.zoomedTaskResult,
        createdAt: Date.now()
      };

      idea.documents.push(newDocument);
      await this.storageService.setItem(this.ideaid, idea);
      this.currentIdea = idea;

      console.log('Document saved successfully!');

    } catch (error) {
      console.error('Error saving document:', error);
    }
  }

  playTask(text: string): void {
    if (this.textToSpeechService.isSpeaking()) {
      this.textToSpeechService.stop();
      return;
    }

    if (text) {
      const textToSpeak = text;
      if (textToSpeak.trim()) {
        const lang = this.languageService.getCurrentLanguageBcp47Tag();
        console.log(`JobcardComponent: Attempting to speak task in ${lang}: "${textToSpeak.substring(0, 50)}..."`);
        this.textToSpeechService.speak(textToSpeak, lang);
      } else {
        console.warn('JobcardComponent: No text content to speak after stripping HTML from zoomedTaskResult.');
      }
    } else {
      console.warn('JobcardComponent: No zoomed task result available to play.');
    }
  }

  stopPlayback(): void {
    console.log('JobcardComponent: Stopping playback.');
    this.textToSpeechService.stop();
  }

  ngOnDestroy(): void {
    console.log('JobcardComponent: Destroyed. Stopping any ongoing playback.');
    this.textToSpeechService.stop();
  }
}