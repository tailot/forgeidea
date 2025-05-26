// Angular Core
import { Injectable } from '@angular/core';

// RxJS
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
/**
 * Service responsible for managing a global loading state in the application.
 * It uses a reference counter to handle multiple concurrent loading requests,
 * emitting the overall loading status through an observable.
 */
export class LoadingService {
  private loadingCounter = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable that emits `true` when the loading counter is greater than zero,
   * and `false` when the loading counter is zero.
   * Components can subscribe to this observable to react to changes in the global loading state.
   */
  public readonly isLoading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Initializes the LoadingService with the loading counter set to zero
   * and the initial loading state as `false`.
   */
  constructor() { }

  /**
   * Increments the loading counter.
   * If the counter transitions from 0 to 1, it emits `true` on the `isLoading$` observable,
   * indicating that a loading process has started.
   */
  show(): void {
    this.loadingCounter++;
    if (this.loadingCounter === 1) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Decrements the loading counter.
   * If the counter transitions from 1 to 0, it emits `false` on the `isLoading$` observable,
   * indicating that all loading processes have completed.
   * The counter will not go below zero.
   */
  hide(): void {
    if (this.loadingCounter > 0) {
      this.loadingCounter--;
    }
    if (this.loadingCounter === 0) {
      this.loadingSubject.next(false);
    }
  }
}