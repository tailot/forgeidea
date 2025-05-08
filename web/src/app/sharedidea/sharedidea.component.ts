import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { io, Socket } from 'socket.io-client';
import { Subscription, interval, timer, takeWhile } from 'rxjs';
import { environment } from '../../environments/environment';

interface IdeaSocketResponse {
  id: string;
  result: string;
}

@Component({
  selector: 'app-shared-idea',
  templateUrl: './sharedidea.component.html',
  styleUrls: ['./sharedidea.component.sass'],
  standalone: true, imports: [CommonModule]

})
export class SharedIdeaComponent implements OnInit, OnDestroy {
  private socket: Socket;
  ideasQueue: { idea: IdeaSocketResponse, timeLeftMs: number }[] = [];
  currentIdea: IdeaSocketResponse | null = null;

  private readonly MAX_QUEUE_SIZE = 5;
  private readonly IDEA_DISPLAY_DURATION_MS = 2 * 60 * 1000;
  private readonly MASTER_TICK_INTERVAL_MS = 1000;
  private discardTimerSubscription: Subscription | null = null;
  private countdownSubscription: Subscription | null = null;
  timeLeftMs: number = 0;
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
      console.log(idea)
      this.handleNewIdea(idea);
    });

    this.socket.on('disconnect', (reason: string) => { });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    this.ensureMasterCountdownIsRunning();
    this.processNextIdea();
  }

  private handleNewIdea(idea: IdeaSocketResponse): void {
    if (this.ideasQueue.length < this.MAX_QUEUE_SIZE) {
      this.ideasQueue.push({ idea, timeLeftMs: this.IDEA_DISPLAY_DURATION_MS });
      if (!this.currentIdea) {
        this.processNextIdea();
      }
      this.ensureMasterCountdownIsRunning();
    }
  }

  private ensureMasterCountdownIsRunning(): void {
    if (this.countdownSubscription && !this.countdownSubscription.closed) {
      return;
    }
    this.countdownSubscription?.unsubscribe();

    this.countdownSubscription = interval(this.MASTER_TICK_INTERVAL_MS).subscribe(() => {
      let activityDetected = false;
      if (this.currentIdea && this.timeLeftMs > 0) {
        this.timeLeftMs -= this.MASTER_TICK_INTERVAL_MS;
        if (this.timeLeftMs < 0) {
          this.timeLeftMs = 0;
        }
        activityDetected = true;
      }

      this.ideasQueue.forEach(queuedItem => {
        if (queuedItem.timeLeftMs > 0) {
          queuedItem.timeLeftMs -= this.MASTER_TICK_INTERVAL_MS;
          if (queuedItem.timeLeftMs < 0) {
            queuedItem.timeLeftMs = 0;
          }
          activityDetected = true;
        }
      });
    });
  }

  private processNextIdea(): void {
    this.discardTimerSubscription?.unsubscribe();

    if (this.currentIdea) {
      this.ideasQueue.push({ idea: this.currentIdea, timeLeftMs: 0 });
      this.currentIdea = null;
      this.timeLeftMs = 0;
    }

    if (this.ideasQueue.length > 0) {
      this.ideasQueue.sort((a, b) => a.timeLeftMs - b.timeLeftMs);
      const nextQueuedItem = this.ideasQueue.shift()!;
      this.currentIdea = nextQueuedItem.idea;
      this.timeLeftMs = nextQueuedItem.timeLeftMs > 0 ? nextQueuedItem.timeLeftMs : this.IDEA_DISPLAY_DURATION_MS;

      this.discardTimerSubscription = timer(this.timeLeftMs).subscribe(() => {
        this.discardCurrentIdea();
      });

      this.ensureMasterCountdownIsRunning();
    } else {
      this.currentIdea = null;
      this.timeLeftMs = 0;
    }
  }

  private discardCurrentIdea(): void {
    this.currentIdea = null;
    this.processNextIdea();
  }

  private clearTimers(): void {
    this.discardTimerSubscription?.unsubscribe();
    this.countdownSubscription?.unsubscribe();
    this.timeLeftMs = 0;
  }
  /*
  getCeilSeconds(milliseconds: number): number {
    return Math.ceil(milliseconds / 1000);
  }
  */
  ngOnDestroy(): void {
    this.clearTimers();
    this.socket?.disconnect();
  }

  get timeLeftSeconds(): number {
    return Math.ceil(this.timeLeftMs / 1000);
  }
}
