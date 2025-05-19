// Angular Core
import { ApplicationRef, Inject, Injectable } from '@angular/core';
// Angular Common
import { DOCUMENT } from '@angular/common';
// Environment
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConsoleOverrideService {
  private originalConsoleLog: (...args: any[]) => void = console.log;

  constructor(
    private appRef: ApplicationRef,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.overrideConsoleLog();
  }

  private overrideConsoleLog(): void {
    if (environment.production) {
      this.originalConsoleLog = console.log;
      console.log = () => { };
      console.warn = () => { };
      console.error = this.originalConsoleLog;
      console.info = () => { };
      console.debug = () => { };
    } else {
      if (this.originalConsoleLog) {
        console.log = this.originalConsoleLog;
      }
    }
  }
}