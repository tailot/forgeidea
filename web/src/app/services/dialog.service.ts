/**
 * @fileoverview Defines the `DialogService` for the Angular web application.
 *
 * This service acts as a convenient wrapper around Angular Material's `MatDialog`
 * service. It simplifies the process of opening standardized application-specific
 * dialogs, such as informational dialogs or confirmation prompts, by pre-configuring
 * them to use the `DialogComponent`. This promotes consistency and reduces boilerplate
 * code when dialogs need to be displayed from various parts of the application.
 */
// Angular Core
import { Injectable } from '@angular/core';

// Angular Material
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

// RxJS
import { Observable, map } from 'rxjs';

// Application-specific Components and Models
import { DialogComponent, DialogData } from '../dialog/dialog.component';

/**
 * Service for managing and displaying application-specific dialogs.
 *
 * This service abstracts the underlying Angular Material `MatDialog` service,
 * providing simplified methods to open pre-configured instances of `DialogComponent`.
 * It is provided in the 'root' injector, making it a singleton available
 * throughout the application.
 *
 * @Injectable Decorator Details:
 *  - `providedIn`: 'root' - Ensures the service is a singleton and available
 *    application-wide without needing to be explicitly added to module providers.
 */
@Injectable({
  providedIn: 'root'
})
export class DialogService {

  /**
   * Constructs the DialogService.
   * @param {MatDialog} dialog - The Angular Material `MatDialog` service,
   *        injected for opening dialog components.
   */
  constructor(private dialog: MatDialog) { }

  /**
   * Opens a standard dialog using the `DialogComponent`.
   *
   * This method takes `DialogData` to configure the title, message, and button text
   * of the `DialogComponent`.
   *
   * @param {DialogData} data - The data to pass to the `DialogComponent`,
   *        conforming to the `DialogData` interface (title, message, closeButtonText, etc.).
   * @returns {MatDialogRef<DialogComponent>} A reference to the opened dialog instance.
   *          This reference can be used to subscribe to events like `afterClosed()`.
   */
  openDialog(data: DialogData): MatDialogRef<DialogComponent> {
    return this.dialog.open<DialogComponent, DialogData>(DialogComponent, {
      data: data,
      // Default dialog configurations (e.g., width, disableClose) could be added here
    });
  }

  /**
   * Opens a confirmation dialog and returns an Observable indicating the user's choice.
   *
   * This method uses `openDialog` internally to display a `DialogComponent` configured
   * with a title, message, and a close button (typically 'OK' or a custom text).
   * The returned Observable emits:
   *  - `true` if the dialog is closed with any truthy result (e.g., by clicking a button
   *    that returns a value from `DialogComponent.onSave()`).
   *  - `false` if the dialog is closed with a falsy result (e.g., undefined by clicking
   *    `DialogComponent.onCancel()` or pressing Escape).
   *
   * Note: For a more robust confirmation, `DialogComponent` would ideally be designed
   * to return specific boolean values or distinct action strings from its close events,
   * which this method could then map more explicitly. The current implementation `!!result`
   * treats any value returned from the dialog as confirmation.
   *
   * @param {string} title - The title of the confirmation dialog.
   * @param {string} message - The message or question to display in the dialog.
   * @param {string} [closeButtonText='OK'] - Optional text for the primary close/confirm button.
   *                                         Defaults to 'OK'.
   * @returns {Observable<boolean>} An observable that emits `true` if the user confirmed
   *          (closed with a truthy value), and `false` otherwise.
   */
  confirm(title: string, message: string, closeButtonText: string = 'OK'): Observable<boolean> {
    const dialogRef = this.openDialog({ title, message, closeButtonText });
    return dialogRef.afterClosed().pipe(map(result => !!result)); // True if any result, false if undefined (e.g. cancel)
  }
}
