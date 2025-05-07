import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { io, Socket } from 'socket.io-client';
import { Subscription, timer, interval } from 'rxjs';
import { environment } from '../../environments/environment';

interface Idea {
  id: string;
  content: string;
  // Add other idea properties here if needed
  // Example: title: string; description: string;
}

@Component({
  selector: 'app-shared-idea',
  templateUrl: './sharedidea.component.html',
  styleUrls: ['./sharedidea.component.sass'],
  standalone: true, imports: [CommonModule]

})
export class SharedIdeaComponent implements OnInit, OnDestroy {
  private socket: Socket;
  ideasQueue: Idea[] = [];
  currentIdea: Idea | null = null;

  private readonly MAX_QUEUE_SIZE = 5;
  private readonly IDEA_DISPLAY_DURATION_MS = 2 * 60 * 1000; // 2 minutes

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
      transports: ['websocket'] // Optional: force websocket if necessary
    });
  }

  ngOnInit(): void {
    this.socket.on('connect', () => {});

    // We assume the server emits 'newIdea' events
    // You might need to change 'newIdea' to the correct event name from your server
    this.socket.on('newIdea', (idea: Idea) => {
      this.handleNewIdea(idea);
    });

    this.socket.on('disconnect', (reason: string) => {});

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    this.processNextIdea();
  }

  private handleNewIdea(idea: Idea): void {
    if (this.ideasQueue.length < this.MAX_QUEUE_SIZE) {
      this.ideasQueue.push(idea);
      if (!this.currentIdea) {
        this.processNextIdea();
      }
    }
  }

  private processNextIdea(): void {
    this.clearTimers();

    if (this.ideasQueue.length > 0) {
      this.currentIdea = this.ideasQueue.shift()!;
      this.timeLeftMs = this.IDEA_DISPLAY_DURATION_MS;

      this.discardTimerSubscription = timer(this.IDEA_DISPLAY_DURATION_MS).subscribe(() => {
        this.discardCurrentIdea();
      });

      this.countdownSubscription = interval(1000).subscribe(() => {
        this.timeLeftMs -= 1000;
        if (this.timeLeftMs <= 0) {
          this.timeLeftMs = 0;
          if (this.countdownSubscription) {
            this.countdownSubscription.unsubscribe();
          }
        }
      });
    } else {
      this.currentIdea = null;
    }
  }

  private discardCurrentIdea(): void {
    this.currentIdea = null;
    this.processNextIdea();
  }

  private clearTimers(): void {
    this.discardTimerSubscription?.unsubscribe();
    this.countdownSubscription?.unsubscribe();
    this.discardTimerSubscription = null;
    this.countdownSubscription = null;
    this.timeLeftMs = 0;
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.socket?.disconnect();
  }

  get timeLeftSeconds(): number {
    return Math.ceil(this.timeLeftMs / 1000);
  }
}