/**
 * @fileoverview Defines the `ConsoleOverrideService` for the Angular web application.
 *
 * This service is responsible for conditionally overriding the default behavior
 * of several `console` methods (log, warn, info, debug). In production environments,
 * it suppresses these logs by replacing them with empty functions.
 * Notably, in production, `console.error` is remapped to the original `console.log`
 * implementation, while other specified console methods are effectively silenced.
 * In non-production environments, it ensures the original `console.log` is restored
 * if it had been previously captured by this service.
 * This service is intended to be instantiated early in the application's lifecycle
 * to apply these overrides globally.
 */
// Angular Core
import { ApplicationRef, Inject, Injectable } from '@angular/core';
// Angular Common
import { DOCUMENT } from '@angular/common';
// Environment
import { environment } from '../../environments/environment';

/**
 * Service responsible for overriding default console logging behaviors.
 *
 * When instantiated (typically as a root-provided service, ensuring it's a singleton
 * created early), it checks the application's environment mode.
 * In production, it suppresses `console.log`, `console.warn`, `console.info`,
 * and `console.debug` by replacing them with empty functions. `console.error`
 * is re-assigned to the original `console.log` function in production.
 * In non-production environments, it ensures `console.log` is restored to its
 * original implementation if this service had previously captured it.
 *
 * The injection of `ApplicationRef` and `DOCUMENT` might be for ensuring service
 * instantiation order or for potential future use, though they are not directly
 * used in the current console overriding logic.
 *
 * @Injectable Decorator Details:
 *  - `providedIn`: 'root' - Makes the service available application-wide as a singleton
 *    without needing to be added to a specific NgModule's providers array.
 */
@Injectable({
  providedIn: 'root',
})
export class ConsoleOverrideService {
  /**
   * Stores a reference to the original `console.log` function.
   * This allows the service to restore the original `console.log` if needed,
   * or use it for other purposes (like remapping `console.error` in production).
   * @private
   */
  private originalConsoleLog: (...args: any[]) => void = console.log;

  /**
   * Constructs the ConsoleOverrideService.
   * The constructor immediately calls `overrideConsoleLog()` to apply the
   * console modifications based on the current environment.
   *
   * @param {ApplicationRef} appRef - Angular's `ApplicationRef`. While injected, it's not
   *        directly used in the current console override logic but might be intended for
   *        future enhancements or to influence service instantiation timing.
   * @param {Document} document - The global `document` object, injected via the `DOCUMENT` token.
   *        Similar to `appRef`, it's injected but not directly used in the current
   *        console override logic.
   */
  constructor(
    private appRef: ApplicationRef,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.overrideConsoleLog();
  }

  /**
   * Overrides console methods based on the application's environment.
   *
   * - In **production** (`environment.production` is true):
   *   - `console.log`, `console.warn`, `console.info`, `console.debug` are replaced
   *     with empty functions, effectively silencing them.
   *   - `console.error` is re-assigned to the original `console.log` function.
   *     (This means errors will be logged via the original log mechanism).
   * - In **non-production**:
   *   - `console.log` is restored to the `this.originalConsoleLog` (which holds
   *     the native `console.log` captured at service instantiation), ensuring that
   *     if it was modified by this service, it's set back. Other console methods
   *     (`warn`, `error`, etc.) are not explicitly restored by this logic block,
   *     relying on their native implementations unless also overridden elsewhere.
   * @private
   */
  private overrideConsoleLog(): void {
    if (environment.production) {
      this.originalConsoleLog = console.log; // Re-capture in case it changed before prod mode check
      console.log = () => { }; // Suppress log
      console.warn = () => { }; // Suppress warn
      console.error = this.originalConsoleLog; // Remap error to original log
      console.info = () => { }; // Suppress info
      console.debug = () => { }; // Suppress debug
    } else {
      // In non-production, ensure console.log is the original one this service captured.
      // This primarily handles scenarios where the service might be initialized multiple times
      // or if console.log was globally altered by another part of the app before this.
      if (this.originalConsoleLog) {
        console.log = this.originalConsoleLog;
      }
    }
  }
}