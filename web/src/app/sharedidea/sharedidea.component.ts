// Angular Core and Common
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  standalone: true, imports: [CommonModule, MatIconModule, CardIdeaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush

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
  private destroyRef = inject(DestroyRef);

  /**
   * The queue of ideas to be displayed. Each item in the array is an object
   * containing the `Idea` data and `timeLeftMs`, which is the remaining display
   * time in milliseconds for that idea.
   */
  ideasQueue = signal<{ idea: Idea, timeLeftMs: number }[]>([]);

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
    const newIdea: Idea = { id: ideaSR.id, text: ideaSR.result };
    this.ideasQueue.update(queue => {
      if (queue.length < this.MAX_QUEUE_SIZE) {
        return [...queue, { idea: newIdea, timeLeftMs: this.IDEA_DISPLAY_DURATION_MS }];
      }
      return queue; // No change if queue is full
    });
    this.ensureMasterCountdownIsRunning(); // Ensure countdown starts/continues
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
    if (this.ideasQueue().length > 0) {
      if (!this.countdownSubscription || this.countdownSubscription.closed) {
        this.countdownSubscription = interval(this.MASTER_TICK_INTERVAL_MS)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.ideasQueue.update(queue => {
              if (queue.length === 0) {
                return []; // Should not happen if subscription is managed correctly
              }
              const updatedQueue = queue.map(item => ({
                ...item,
                timeLeftMs: Math.max(0, item.timeLeftMs - this.MASTER_TICK_INTERVAL_MS)
              }));
              return updatedQueue.filter(item => item.timeLeftMs > 0);
            });

            if (this.ideasQueue().length === 0) {
              this.stopCountdown(); // Stop if queue becomes empty
            }
          });
      }
    } else {
      this.stopCountdown(); // Stop if queue is or becomes empty
    }
  }

  /**
   * Clears (unsubscribes from) the master countdown timer subscription.
   * This method is primarily for explicitly stopping the timer when the queue is empty.
   * `takeUntilDestroyed` handles unsubscription on component destruction.
   * @private
   */
  private stopCountdown(): void {
    if (this.countdownSubscription && !this.countdownSubscription.closed) {
      this.countdownSubscription.unsubscribe();
    }
    this.countdownSubscription = null;
  }

  /**
   * Performs cleanup when the component is destroyed.
   * Disconnects the Socket.IO client. `takeUntilDestroyed` handles the countdown subscription.
   */
  ngOnDestroy(): void {
    this.socket?.disconnect();
  }

  /**
   * Gets the remaining display time in seconds for the idea currently at the
   * front of the queue (the one being displayed).
   * @returns The remaining time in seconds, rounded up. Returns 0 if the queue is empty.
   */
  get timeLeftSeconds(): number {
    const currentQueue = this.ideasQueue();
    if (currentQueue.length > 0) {
      return Math.ceil(currentQueue[0].timeLeftMs / 1000);
    }
    return 0;
  }

}
