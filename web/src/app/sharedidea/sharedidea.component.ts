// Angular Core and Common
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

// Angular Material
import { MatIconModule } from '@angular/material/icon';

// Third-party Libraries
import { Subscription, interval } from 'rxjs';
import { Socket, io } from 'socket.io-client';

// Application-specific Components, Services and Models
import { CardIdeaComponent } from '../card-idea/card-idea.component';
import { Idea } from '../services/genkit.service';

// Environment
import { environment } from '../../environments/environment';

interface IdeaSocketResponse {
  id: string;
  result: string;
}

@Component({
  selector: 'app-shared-idea',
  templateUrl: './sharedidea.component.html',
  styleUrls: ['./sharedidea.component.sass'],
  standalone: true, imports: [CommonModule, MatIconModule, CardIdeaComponent]

})
export class SharedIdeaComponent implements OnInit, OnDestroy {
  private socket: Socket;
  ideasQueue: { idea: Idea, timeLeftMs: number }[] = [];

  private readonly MAX_QUEUE_SIZE = 5;
  public readonly IDEA_DISPLAY_DURATION_MS = 2 * 60 * 1000;
  private readonly MASTER_TICK_INTERVAL_MS = 1000;
  private countdownSubscription: Subscription | null = null;
  public get MAX_QUEUE_SIZE_FOR_TEMPLATE(): number {
    return this.MAX_QUEUE_SIZE;
  }
  public get IDEA_DISPLAY_DURATION_MS_FOR_TEMPLATE(): number {
    return this.IDEA_DISPLAY_DURATION_MS;
  }

  constructor() {
    this.socket = io(environment.socketAddr, {
      transports: ['websocket']
    });
  }

  ngOnInit(): void {
    this.socket.on('connect', () => { });
    this.socket.on('newIdea', (idea: IdeaSocketResponse) => {
      this.handleNewIdea(idea);
    });

    this.socket.on('disconnect', () => { });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    this.ensureMasterCountdownIsRunning();
  }

  private handleNewIdea(ideaSR: IdeaSocketResponse): void {
    if (this.ideasQueue.length < this.MAX_QUEUE_SIZE) {
      const idea: Idea = { id: ideaSR.id, text: ideaSR.result };
      this.ideasQueue.push({ idea, timeLeftMs: this.IDEA_DISPLAY_DURATION_MS });
      this.ensureMasterCountdownIsRunning();
    }
  }

  private ensureMasterCountdownIsRunning(): void {
    if (this.ideasQueue.length > 0) {
      if (!this.countdownSubscription || this.countdownSubscription.closed) {
        this.countdownSubscription = interval(this.MASTER_TICK_INTERVAL_MS).subscribe(() => {
          if (this.ideasQueue.length === 0) {
            this.countdownSubscription?.unsubscribe();
            this.countdownSubscription = null;
            return;
          }
          for (const queuedItem of this.ideasQueue) {
            if (queuedItem.timeLeftMs > 0) {
              queuedItem.timeLeftMs -= this.MASTER_TICK_INTERVAL_MS;
              if (queuedItem.timeLeftMs < 0) {
                queuedItem.timeLeftMs = 0;
              }
            }
          }

          while (this.ideasQueue.length > 0 && this.ideasQueue[0].timeLeftMs <= 0) {
            this.ideasQueue.shift();
          }

          if (this.ideasQueue.length === 0) {
            this.countdownSubscription?.unsubscribe();
            this.countdownSubscription = null;
          }
        });
      }
    } else {
      if (this.countdownSubscription && !this.countdownSubscription.closed) {
        this.countdownSubscription.unsubscribe();
        this.countdownSubscription = null;
      }
    }
  }

  private clearTimers(): void {
    this.countdownSubscription?.unsubscribe();
    this.countdownSubscription = null;
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.socket?.disconnect();
  }

  get timeLeftSeconds(): number {
    if (this.ideasQueue.length > 0) {
      return Math.ceil(this.ideasQueue[0].timeLeftMs / 1000);
    }
    return 0;
  }

}
