import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CardIdeaComponent, CardIdeaEmitData } from '../card-idea/card-idea.component';
import { GenkitService, DiscardTasksRequestData, ZoomTaskRequestData, Idea } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';
import { TexttospeechService } from '../services/texttospeech.service';


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
    CardIdeaComponent]
})
export class JobcardComponent implements OnInit, OnDestroy {
  selectedTasks: string[] = [];
  ideaid: string | null = null;
  tasks: string[] | null = null;
  currentIdea: Idea | null = null;
  isDiscarding: boolean = false;

  zoomedTaskResult: string | null = null;
  errorMessage: string | null = null;

  constructor(private route: ActivatedRoute,
    private genkitService: GenkitService,
    private languageService: LanguageService,
    private storageService: StorageService,
    private textToSpeechService: TexttospeechService
  ) { }

  ngOnInit(): void {
    this.ideaid = this.route.snapshot.paramMap.get('uuid');
  }

  showTasks(tasksAndIdea: CardIdeaEmitData): void {
    console.log('Received data in Jobcard:', tasksAndIdea);
    this.errorMessage = null;
    this.currentIdea = tasksAndIdea.idea;

    if (Array.isArray(tasksAndIdea.tasks)) {
      this.tasks = tasksAndIdea.tasks;
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

  zoomTask(): void {
    this.errorMessage = null;
    this.zoomedTaskResult = null; // Clear previous result

    if (!this.currentIdea || !this.currentIdea.text) {
      this.errorMessage = 'Idea information is missing.';
      console.error(this.errorMessage);
      return;
    }

    const taskToZoom = this.selectedTasks[0];
    const language = this.languageService.getCurrentLanguageBackendName();

    const requestData: ZoomTaskRequestData = {
      idea: this.currentIdea.text,
      task: taskToZoom,
      language: language
    };

    console.log('Calling callZoomTask with data:', requestData);
    this.genkitService.callZoomTask(requestData, false).subscribe({
      next: (result: string) => {
        console.log('Received zoomed task result:', result);
        this.zoomedTaskResult = result; // Store the result (assuming it's HTML or plain text)
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
      return; // Need at least two tasks to navigate
    }

    const currentTask = this.selectedTasks.length > 0 ? this.selectedTasks[0] : null;
    let currentIndex = currentTask ? this.tasks.indexOf(currentTask) : -1;

    // Calculate next index with wrap-around
    let nextIndex = (currentIndex + 1) % this.tasks.length;

    // Update selected tasks
    this.selectedTasks = [this.tasks[nextIndex]];
    console.log("Selected next task:", this.selectedTasks[0]);

    // Call zoomTask
    this.zoomTask();
  }

  selectPreviousTask(): void {
    if (!this.tasks || this.tasks.length < 2) {
      console.warn("Cannot select previous task: Not enough tasks available.");
      return; // Need at least two tasks to navigate
    }

    const currentTask = this.selectedTasks.length > 0 ? this.selectedTasks[0] : null;
    let currentIndex = currentTask ? this.tasks.indexOf(currentTask) : 0; // Default to 0 if none selected

    // Calculate previous index with wrap-around
    let previousIndex = (currentIndex - 1 + this.tasks.length) % this.tasks.length;

    // Update selected tasks
    this.selectedTasks = [this.tasks[previousIndex]];
    console.log("Selected previous task:", this.selectedTasks[0]);

    // Call zoomTask
    this.zoomTask();
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
            this.errorMessage = `Errore durante il salvataggio dei task aggiornati: ${saveError instanceof Error ? saveError.message : 'Errore sconosciuto'}`;
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

  playTask(): void {
    if (this.textToSpeechService.isSpeaking()) {
      this.textToSpeechService.stop();
      return;
    }

    if (this.zoomedTaskResult) {
      const textToSpeak = this.zoomedTaskResult;
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