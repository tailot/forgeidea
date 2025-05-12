import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { io, Socket as SocketIoClientSocket } from 'socket.io-client';

import { StorageService } from '../services/storage.service';
import { Idea, GenkitService, GenerateTasksRequestData, ScoreIdeaRequestData, OperationRequestData, IdeaDocument } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { environment } from '../../environments/environment';

export interface CardIdeaEmitData {
  tasks: { text: string[] };
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
  @Input() ideaUuid: string | null = null; 
  @Input() evaluateScore: boolean = false;
  @Input() tasksButton = false;
  @Input() sharedButton = false;
  @Input() documentsButton = false;
  @Input() fusionButton = false;
  @Input() trashButton = true;
  @Input() addIdeaButton : boolean | null = false;


  @Output() tasksOn = new EventEmitter<CardIdeaEmitData>();
  @Output() documentsOn = new EventEmitter<Idea>();
  @Output() isDeleted = new EventEmitter<string>();

  ideaScore: number | null = null;
  isScoring: boolean = false; 
  isLoading: boolean = true;
  isGeneratingTasks: boolean = false;
  isOperating: boolean = false;
  operationData: Idea | null = null;
  mergiable: boolean = true;

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
  
  async clearOperation(): Promise<void> {
    this.storageService.removeItem('operation');
    this.mergiable = true;
  }

  async operation(): Promise<void> {
    if (!this.idea) {
      console.error('Cannot perform operation: Current idea is missing.');
      return;
    }

    const operationKey = 'operation';
    this.isOperating = true; 
    // console.log(`Checking storage for key: ${operationKey}`);

    try {
      const existingOperationData = await this.storageService.getItem<Idea>(operationKey);

      if (!existingOperationData) {
        // console.log(`Key '${operationKey}' not found or empty. Populating with current idea.`);
        

        await this.storageService.setItem(operationKey, this.idea);
        // console.log(`Successfully stored data under key '${operationKey}'.`);
          
        this.mergiable = false;
      } else if (existingOperationData && existingOperationData.id && existingOperationData.id !== this.idea.id) {
        // console.log(`Found existing operation data with a different idea ID. Proceeding with operation: Combine`);

        const requestData : OperationRequestData = {
          idea1: existingOperationData.text,
          idea2: this.idea.text,
          operation: "Combine", 
          language: this.languageService.getCurrentLanguageBackendName()
        };

        this.genkitService.callOperation(requestData, true).subscribe({ 
          next: async (newIdeaText: string) => {
            const newIdeaUuid = crypto.randomUUID();
            await this.createIdea(newIdeaUuid,newIdeaText,requestData.language).then(newIdea => {
              this.storageService.setItem(newIdeaUuid, newIdea);
              this.storageService.removeItem(operationKey);
              this.router.navigate(['/jobcard', newIdeaUuid]);
            })

          },
          error: (error) => {
            console.error('Error during idea operation:', error);
            // TODO: Handle error, e.g., show a snackbar
            this.isOperating = false; 
          }
        });
      }else {
        this.mergiable = false;
      }
    } catch (error) {
      console.error(`Error accessing or setting storage for key '${operationKey}':`, error);
      // TODO: Handle error, e.g., show a snackbar
    }
  }
  async shareCurrentIdea(cardIdea: Idea): Promise<void> {
    this.sharedButton = false;

    if (cardIdea && cardIdea.text) {
      const payload = { text: cardIdea.text };
      
      this.socket.emit('idea', payload); 

    } else {
      console.warn('No text to share.');
    }
  }

  async documentsEmiter(idea: Idea): Promise<void> {
    this.documentsOn.emit(idea);
  }
  
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
      // console.log(`Generating tasks for idea: ${idea.id}`);
      const language = this.languageService.getCurrentLanguageBackendName();
      const requestData: GenerateTasksRequestData = { idea: idea.text, language: language };
      this.genkitService.callGenerateTasks(requestData, false).subscribe({
        next: (tasksResult: any) => {

          const tasksToStore = { text: tasksResult as string[] }; // Ensure tasks are stored in {text: string[]} format
          this.storageService.setItem(tasksKey, tasksToStore)
            .then(() => {
              this.tasksOn.emit({ tasks: tasksToStore, idea: idea }); // Emit consistently
            })
            .catch(saveError => {
              console.error(`Error saving generated tasks with key ${tasksKey}:`, saveError);
            })
            .finally(() => {
              this.isGeneratingTasks = false;
            });
        },
        error: (error) => {
          this.isGeneratingTasks = false;
        }
      });

    } catch (storageError) {
      console.error(`Error accessing storage for key ${tasksKey}:`, storageError);
      this.isGeneratingTasks = false;
    }
  }

  async createIdea(uuid: string,text: string, language?: string): Promise<Idea> {
    const newIdeaUuid = crypto.randomUUID();
    const newIdea: Idea = {
      id: uuid,
      text: text,
      language: language
    };
    return newIdea
  }

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
  addIdea(idea: Idea){
    const newIdeaUuid = crypto.randomUUID();
    this.storageService.setItem(newIdeaUuid, idea);
    this.addIdeaButton = false;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaluateScore'] && changes['evaluateScore'].currentValue === true && this.idea) {
      this.evaluateIdeaScore(this.idea);
    }
  }

  ngOnInit(): void {
    this.isLoading = true;

    if (this.idea) {
      this.isLoading = false;
      if (this.evaluateScore) {
        this.evaluateIdeaScore(this.idea);
      }
      this.checkOperationState(); 
      return;
    }

    if (this.ideaUuid) {
      this.loadIdeaData(this.ideaUuid);
    }
  }

  private async loadIdeaData(uuid: string): Promise<void> {
    this.isLoading = true;
    try {
      const retrievedIdea = await this.storageService.getItem<Idea>(uuid).then(idea => {
        if(idea){
          idea.id = uuid;
          this.idea = idea;
          if (this.evaluateScore) {
            this.evaluateIdeaScore(this.idea);
          }
          this.checkOperationState(); 
        }
      })
    } finally {
      this.isLoading = false;
    }
  }

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
        if (scoreResult && typeof scoreResult === 'number') {
          this.ideaScore = scoreResult;

        }
        this.isScoring = false;
      },
      error: (error) => {        
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
