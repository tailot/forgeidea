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
/**
 * Component for displaying a real-time queue of "shared ideas".
 * It connects to a Socket.IO server to receive new ideas, manages them in a queue,
 * and displays each idea for a fixed duration with a countdown.
 * The queue has a maximum size, and older ideas are removed as new ones arrive or their display time expires.
 */
export class SharedIdeaComponent implements OnInit, OnDestroy {
  /** @private The Socket.IO client instance for real-time communication. */
  private socket: Socket;

  /**
   * The queue of ideas to be displayed. Each item in the array is an object
   * containing the `Idea` data and `timeLeftMs`, which is the remaining display
   * time in milliseconds for that idea.
   */
  ideasQueue: { idea: Idea, timeLeftMs: number }[] = [];

  /** @private Maximum number of ideas that can be held in the `ideasQueue`. */
  private readonly MAX_QUEUE_SIZE = 5;
  /** Public constant defining the total duration (in milliseconds) each idea should be displayed. */
  public readonly IDEA_DISPLAY_DURATION_MS = 2 * 60 * 1000; // 2 minutes
  /** @private Interval (in milliseconds) for the master countdown timer that updates `timeLeftMs` for all queued ideas. */
  private readonly MASTER_TICK_INTERVAL_MS = 1000; // 1 second
  /** @private Subscription to the master countdown interval. */
  private countdownSubscription: Subscription | null = null;

  /** Getter for the maximum queue size, accessible from the component's template. */
  public get MAX_QUEUE_SIZE_FOR_TEMPLATE(): number {
    return this.MAX_QUEUE_SIZE;
  }
  /** Getter for the idea display duration, accessible from the component's template. */
  public get IDEA_DISPLAY_DURATION_MS_FOR_TEMPLATE(): number {
    return this.IDEA_DISPLAY_DURATION_MS;
  }

  /**
   * Constructs the SharedIdeaComponent.
   * Initializes the Socket.IO connection to the server specified in the environment configuration.
   */
  constructor() {
    this.socket = io(environment.socketAddr, {
      transports: ['websocket'] // Explicitly use WebSocket transport
    });
  }

  /**
   * Initializes the component after Angular first displays the data-bound properties.
   * Sets up Socket.IO event listeners for 'connect', 'newIdea', 'disconnect', and 'connect_error'.
   * Ensures the master countdown timer is started if there are any pre-existing ideas (though typically queue is empty on init).
   */
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

  /**
   * Handles a new idea received from the Socket.IO server.
   * If the queue is not full, it transforms the `IdeaSocketResponse` into an `Idea` object,
   * adds it to the `ideasQueue` with the initial display duration, and ensures the master
   * countdown timer is running.
   * @param ideaSR The raw idea data received from the socket.
   * @private
   */
  private handleNewIdea(ideaSR: IdeaSocketResponse): void {
    if (this.ideasQueue.length < this.MAX_QUEUE_SIZE) {
      const idea: Idea = { id: ideaSR.id, text: ideaSR.result };
      this.ideasQueue.push({ idea, timeLeftMs: this.IDEA_DISPLAY_DURATION_MS });
      this.ensureMasterCountdownIsRunning(); // Ensure countdown starts/continues
    }
  }

  /**
   * Manages the master countdown timer.
   * If there are ideas in the queue and the countdown is not already running, it starts
   * an interval timer that ticks every `MASTER_TICK_INTERVAL_MS`.
   * On each tick, it decrements `timeLeftMs` for all ideas in the queue.
   * Ideas whose `timeLeftMs` reaches zero are removed from the front of the queue.
   * If the queue becomes empty, the countdown timer is stopped.
   * @private
   */
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

  /**
   * Clears (unsubscribes from) the master countdown timer subscription.
   * @private
   */
  private clearTimers(): void {
    this.countdownSubscription?.unsubscribe();
    this.countdownSubscription = null;
  }

  /**
   * Performs cleanup when the component is destroyed.
   * Clears any active timers/subscriptions and disconnects the Socket.IO client.
   */
  ngOnDestroy(): void {
    this.clearTimers();
    this.socket?.disconnect();
  }

  /**
   * Gets the remaining display time in seconds for the idea currently at the
   * front of the queue (the one being displayed).
   * @returns The remaining time in seconds, rounded up. Returns 0 if the queue is empty.
   */
  get timeLeftSeconds(): number {
    if (this.ideasQueue.length > 0) {
      return Math.ceil(this.ideasQueue[0].timeLeftMs / 1000);
    }
    return 0;
  }

}
