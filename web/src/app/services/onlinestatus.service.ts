import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OnlineStatusService {
  private onlineStatus$: BehaviorSubject<boolean>;

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

  get isOnline$(): Observable<boolean> {
    return this.onlineStatus$.asObservable().pipe(
      tap(status => console.log(`OnlineStatusService: isOnline$ emitting to subscribers: ${status}`)),
      distinctUntilChanged()
    );
  }

  public get isCurrentlyOnline(): boolean {
    return this.onlineStatus$.getValue();
  }
}