import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { io, Socket as SocketIoClientSocket } from 'socket.io-client'; // Alias per chiarezza

import { StorageService } from '../services/storage.service';
import { Idea, GenkitService, GenerateTasksRequestData, ScoreIdeaRequestData, OperationRequestData } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { environment } from '../../environments/environment';

export interface CardIdeaEmitData {
  tasks: { text: string[] } | string[];
  idea: Idea;
}

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

  @Input() idea: Idea | null = null;
  @Input() showActions: boolean = true;
  @Input() ideaUuid: string | null = null; // UUID dell'idea se non viene passata direttamente
  @Input() evaluateScore: boolean = false;
  @Input() tasksButton = false;
  @Input() sharedButton = false;

  @Output() tasksOn = new EventEmitter<CardIdeaEmitData>();

  ideaScore: number | null = null;
  isScoring: boolean = false; // <-- Stato di caricamento per il punteggio
  isLoading: boolean = true;
  errorMessage: string | null = null;
  isGeneratingTasks: boolean = false;
  isOperating: boolean = false; // <-- Stato di caricamento per l'operazione
  operationData: Idea | null = null;
  mergiable: boolean = true; // Default to true (button enabled)
  
  private socket: SocketIoClientSocket;

  constructor(
    private route: ActivatedRoute,
    private storageService: StorageService,
    private router: Router,
    private genkitService: GenkitService,
    private languageService: LanguageService,
    private snackBar: MatSnackBar
  ) {
    this.socket = io(environment.socketAddr, {
      transports: ['websocket']
    });
  }

  private async checkOperationState(): Promise<void> {
    if (!this.idea || !this.idea.id) return; // Need an idea with an ID

    try {
      const operationKey = 'operation';
      const existingOperationData = await this.storageService.getItem<Idea>(operationKey);
      if (existingOperationData && existingOperationData.id === this.idea.id) {
        console.log(`CardIdeaComponent: Operation key contains the current idea (${this.idea.id}). Disabling merge button.`);
        this.mergiable = false;
      }
    } catch (error) {
      console.error(`CardIdeaComponent: Error checking operation state in storage:`, error);
      // Decide if you want to disable the button on error or keep it enabled
    }
  }
  
  async clearOperation(): Promise<void> {
    this.storageService.removeItem('operation');
    this.mergiable = true;
  }

  async operation(): Promise<void> {
    if (!this.idea) {
      console.error('Cannot perform operation: Current idea is missing.');
      this.errorMessage = 'Idea corrente non disponibile per l\'operazione.';
      return;
    }

    const operationKey = 'operation';
    this.errorMessage = null; // Reset error message
    this.isOperating = true; // Start loading indicator
    console.log(`Checking storage for key: ${operationKey}`);


    try {
      const existingOperationData = await this.storageService.getItem<Idea>(operationKey);

      if (!existingOperationData) {
        console.log(`Key '${operationKey}' not found or empty. Populating with current idea.`);
        // Store the first idea and the default operation type

        await this.storageService.setItem(operationKey, this.idea);
        console.log(`Successfully stored data under key '${operationKey}'.`);
        // Optionally provide user feedback that the first idea is selected
        // e.g., using MatSnackBar
        this.mergiable = false;
      } else if (existingOperationData && existingOperationData.id && existingOperationData.id !== this.idea.id) {
        console.log(`Found existing operation data with a different idea ID. Proceeding with operation: Combine`);

        const requestData : OperationRequestData = {
          idea1: existingOperationData.text,
          idea2: this.idea.text,
          operation: "Combine", // Use the stored operation type
          language: this.languageService.getCurrentLanguageBackendName()
        };

        this.genkitService.callOperation(requestData, true).subscribe({ // bypassCache = true for operations
          next: async (newIdeaText: string) => {
            console.log('Operation successful. New idea text:', newIdeaText);
            const newIdeaUuid = crypto.randomUUID();
            const newIdea: Idea = {
              id: newIdeaUuid,
              text: newIdeaText,
              // category: 'Combined/Integrated', // Or derive category if needed
              language: requestData.language // Store language used for generation
            };

            await this.storageService.setItem(newIdeaUuid, newIdea);
            console.log(`New idea saved with UUID: ${newIdeaUuid}`);
            await this.storageService.removeItem(operationKey); // Clean up the operation key
            console.log(`Removed operation key: ${operationKey}`);
            this.router.navigate(['/jobcard', newIdeaUuid]); // Navigate to the new idea's page
          },
          error: (error) => {
            console.error('Error during idea operation:', error);
            this.errorMessage = `Errore durante l'operazione tra idee: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
            this.isOperating = false; // Stop loading on error
          }
        });
      }else {
        this.mergiable = false;
      }
    } catch (error) {
      console.error(`Error accessing or setting storage for key '${operationKey}':`, error);
      this.errorMessage = `Errore durante l'operazione di storage: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
    }
  }
  async shareCurrentIdea(cardIdea: Idea): Promise<void> {
    this.sharedButton = false;

    if (cardIdea && cardIdea.text) {
      const payload = { text: cardIdea.text };
      
      this.socket.emit('idea', payload); // Emetti l'evento 'idea' con il payload
      console.log(`Idea "${cardIdea.text}" inviata al server.`);
      this.snackBar.open(`Idea "${cardIdea.text.substring(0, 30)}..." condivisa!`, 'OK', {
        duration: 3000,
      });
    } else {
      console.warn('Nessun testo dell\'idea da condividere o idea non definita.');
    }
  }
  async tasksEmiter(idea: Idea): Promise<void> {
    if (this.isOperating) {
      console.log("Operation in progress, tasks generation skipped.");
      return; // Avoid starting task generation if an operation is running
    }
    if (!idea || !idea.id) {
      console.error('Cannot check/generate tasks: Idea or idea ID is missing.');
      this.errorMessage = 'Informazioni sull\'idea mancanti per recuperare i task.';
      return;
    }

    const tasksKey = `tasks_${idea.id}`;
    this.errorMessage = null;

    try {
      console.log(`Checking storage for tasks with key: ${tasksKey}`);
      const existingTasks = await this.storageService.getItem<{ text: string[] }>(tasksKey);

      if (existingTasks) {
        console.log('Tasks found in storage. Emitting existing tasks:', existingTasks);
        this.tasksOn.emit({ tasks: existingTasks, idea: idea });
        return;
      }

      console.log(`Tasks not found for key ${tasksKey}. Proceeding to generate.`);
      if (!idea.text) {
        console.error('Cannot generate tasks: Idea text is missing.');
        this.errorMessage = 'Testo dell\'idea mancante per generare i task.';
        return;
      }

      this.isGeneratingTasks = true;
      console.log(`Generating tasks for idea: ${idea.id}`);
      const language = this.languageService.getCurrentLanguageBackendName();
      const requestData: GenerateTasksRequestData = { idea: idea.text, language: language };
      this.genkitService.callGenerateTasks(requestData, false).subscribe({
        next: (tasksResult: any) => {
          console.log('Tasks generated:', tasksResult);
          console.log(`Saving generated tasks to storage with key: ${tasksKey}`);

          this.storageService.setItem(tasksKey, tasksResult)
            .then(() => {
              console.log('Generated tasks saved successfully.');
              this.tasksOn.emit({ tasks: tasksResult, idea: idea });
            })
            .catch(saveError => {
              console.error(`Error saving generated tasks with key ${tasksKey}:`, saveError);
              this.errorMessage = `Errore durante il salvataggio dei task generati: ${saveError instanceof Error ? saveError.message : 'Errore sconosciuto'}`;
            })
            .finally(() => {
              this.isGeneratingTasks = false;
            });
        },
        error: (error) => {
          console.error('Error generating tasks:', error);
          this.errorMessage = `Errore durante la generazione dei task: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
          this.isGeneratingTasks = false;
        }
      });

    } catch (storageError) {
      console.error(`Error accessing storage for key ${tasksKey}:`, storageError);
      this.errorMessage = `Errore durante l'accesso allo storage: ${storageError instanceof Error ? storageError.message : 'Errore sconosciuto'}`;
      this.isGeneratingTasks = false;
    }
  }

  async deleteIdea(uuid: string): Promise<void> {
    if (!uuid) {
      console.error('Cannot delete: Idea UUID is missing.');
      return;
    }

    console.log(`Attempting to delete idea with uuid: ${uuid}`);
    const tasksKey = `tasks_${uuid}`;
    console.log(`Also attempting to delete associated tasks with key: ${tasksKey}`);

    try {
      await Promise.all([
        this.storageService.removeItem(uuid),
        this.storageService.removeItem(tasksKey)
      ]);

      console.log(`Successfully deleted idea ${uuid} and tasks ${tasksKey}`);
      this.router.navigate(['/list']);
    } catch (error) {
      console.error(`Error deleting idea with uuid ${uuid} or its tasks:`, error);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaluateScore'] && changes['evaluateScore'].currentValue === true && this.idea) {
      console.log(`CardIdeaComponent: evaluateScore triggered for idea ${this.idea.id}`);
      this.evaluateIdeaScore(this.idea);
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (!!this.idea) {
      console.log('CardIdeaComponent: Using pre-populated idea input.');
      this.isLoading = false;
      if (this.evaluateScore) {
        this.evaluateIdeaScore(this.idea);
      }
      this.checkOperationState(); // Check operation state for pre-populated idea
      return;
    }

    if (this.ideaUuid) {
      console.log(`CardIdeaComponent: Using provided input UUID: ${this.ideaUuid}`);
      this.loadIdeaData(this.ideaUuid);
    }
  }

  private async loadIdeaData(uuid: string): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    console.log(`CardIdeaComponent: Loading idea data for UUID: ${uuid}`);
    try {
      const retrievedIdea = await this.storageService.getItem<any>(uuid);
      
      if (retrievedIdea) {
        delete retrievedIdea.language;
        delete retrievedIdea.category;
        delete retrievedIdea.id;

        this.idea = {
          id: uuid,
          text: Object.values(retrievedIdea).join('')
        };
        console.log('CardIdeaComponent: Idea data loaded successfully:', this.idea);
        if (this.evaluateScore) {
          console.log(`CardIdeaComponent: evaluateScore is true, evaluating loaded idea ${this.idea.id}`);
          this.evaluateIdeaScore(this.idea);
        }
        this.checkOperationState(); // Check operation state after loading idea
      } else {
        console.warn(`CardIdeaComponent: No idea found in storage for UUID: ${uuid}`);
        this.errorMessage = `L'idea con identificativo ${uuid} non è stata trovata. Potrebbe essere stata cancellata.`;
      }
    } catch (error) {
      console.error(`CardIdeaComponent: Error loading idea data for UUID ${uuid}:`, error);
      this.errorMessage = `Si è verificato un errore durante il caricamento dell'idea. ${error instanceof Error ? error.message : ''}`;
    } finally {
      this.isLoading = false;
    }
  }

  private evaluateIdeaScore(idea: Idea): void {
    if (!idea || !idea.text) {
      console.error('Cannot evaluate score: Idea or idea text is missing.');
      return;
    }

    console.log(`CardIdeaComponent: Evaluating score for idea ${idea.id}`);
    this.isScoring = true;
    this.ideaScore = null;
    const requestData: ScoreIdeaRequestData = { idea: idea.text };

    this.genkitService.callScoreIdea(requestData, false, true).subscribe({
      next: (scoreResult: number) => {
        console.log(`Score received for idea ${idea.id}:`, scoreResult);
        if (scoreResult && typeof scoreResult === 'number') {
          this.ideaScore = scoreResult;

        } else {
          console.warn(`Invalid score format received for idea ${idea.id}:`, scoreResult);
        }
        this.isScoring = false;
      },
      error: (error) => {
        console.error(`Error evaluating score for idea ${idea.id}:`, error);
        // Potresti voler mostrare un messaggio di errore specifico per lo score
        this.isScoring = false;
      }
    });
  }

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

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
