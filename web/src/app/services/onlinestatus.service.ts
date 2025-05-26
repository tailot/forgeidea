// Angular Core
import { Injectable, NgZone } from '@angular/core';

// RxJS
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';

// RxJS Operators
import { distinctUntilChanged, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
/**
 * Service to monitor and report the application's online or offline status.
 * It listens to browser online/offline events and provides an observable
 * and a direct getter for the current status.
 */
export class OnlineStatusService {
  private onlineStatus$: BehaviorSubject<boolean>;

  /**
   * Initializes the OnlineStatusService.
   * Sets the initial online status based on `navigator.onLine`.
   * Sets up event listeners for `online` and `offline` events on the `window` object
   * to update the status. These listeners are run outside of Angular's zone for performance,
   * and updates are brought back into the zone.
   * @param ngZone Angular's NgZone service to manage running tasks inside or outside Angular's change detection.
   */
  constructor(private ngZone: NgZone) {
    const initialState = typeof navigator !== 'undefined' && navigator.onLine;
    this.onlineStatus$ = new BehaviorSubject<boolean>(initialState);
    console.log('OnlineStatusService: Initial state:', initialState);

    if (typeof window !== 'undefined') {
      this.ngZone.runOutsideAngular(() => {
        fromEvent(window, 'online').pipe(map(() => true))
          .subscribe(() => {
            this.ngZone.run(() => {
              if (this.onlineStatus$.getValue() !== true) {
                console.log('OnlineStatusService: Event ONLINE detected. Updating status to true.');
                this.onlineStatus$.next(true);
              }
            });
          });

        fromEvent(window, 'offline').pipe(map(() => false))
          .subscribe(() => {
            this.ngZone.run(() => {
              if (this.onlineStatus$.getValue() !== false) {
                console.log('OnlineStatusService: Event OFFLINE detected. Updating status to false.');
                this.onlineStatus$.next(false);
              }
            });
          });
      });
    } else {
      console.warn('OnlineStatusService: Window object not available. Online status detection might not work (e.g., during SSR).');
    }
  }

  /**
   * Observable that emits the application's online status.
   * Emits `true` when the application is online, and `false` when offline.
   * Uses `distinctUntilChanged` to ensure that subscribers are only notified
   * when the status actually changes.
   * @returns An Observable of boolean values representing the online status.
   */
  get isOnline$(): Observable<boolean> {
    return this.onlineStatus$.asObservable().pipe(
      tap(status => console.log(`OnlineStatusService: isOnline$ emitting to subscribers: ${status}`)),
      distinctUntilChanged()
    );
  }

  /**
   * Synchronously gets the current online status of the application.
   * @returns `true` if the application is currently considered online, `false` otherwise.
   */
  public get isCurrentlyOnline(): boolean {
    return this.onlineStatus$.getValue();
  }
}