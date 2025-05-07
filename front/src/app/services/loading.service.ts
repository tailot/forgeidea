import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCounter = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public readonly isLoading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() { }

  show(): void {
    this.loadingCounter++;
    if (this.loadingCounter === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    if (this.loadingCounter > 0) {
      this.loadingCounter--;
    }
    if (this.loadingCounter === 0) {
      this.loadingSubject.next(false);
    }
  }
}