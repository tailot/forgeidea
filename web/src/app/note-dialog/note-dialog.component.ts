/**
 * @fileoverview Defines the `NoteDialogComponent` and its associated data interface `NoteDialogData`.
 *
 * The `NoteDialogComponent` is a UI component designed to be displayed within an
 * Angular Material dialog. It serves the purpose of viewing and editing an individual
 * "note". The component receives the note data and its context (such as its index
 * in a list and whether it's the first or last note) via `MAT_DIALOG_DATA`.
 *
 * Key functionalities include:
 *  - Displaying the text of a note in an editable text area.
 *  - Allowing the user to save changes or cancel editing.
 *  - Emitting events to request navigation to the previous or next note.
 *  - Emitting an event to request the deletion of the current note.
 *
 * This component is typically opened and managed by a parent component or service
 * that utilizes Angular Material's `MatDialog` service.
 */
// Angular Core and Common
import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';

// Application-specific
import { Note } from '../notes/notes.component';

/**
 * Interface defining the structure of data passed to the `NoteDialogComponent`.
 * This data includes the note to be displayed/edited and contextual information
 * about its position within a list (e.g., for enabling/disabling next/previous navigation).
 */
export interface NoteDialogData {
  /** The note object to be displayed or edited in the dialog. */
  note: Note;
  /** The index of the current note, typically within an array of notes. */
  index: number;
  /** Boolean flag indicating if the current note is the first in its list. */
  isFirst: boolean;
  /** Boolean flag indicating if the current note is the last in its list. */
  isLast: boolean;
}

/**
 * A standalone component for displaying and editing a single note within an
 * Angular Material dialog.
 *
 * It allows users to view a note's text, edit it, save changes, or cancel.
 * Additionally, it provides functionality to emit events for navigating to
 * the previous or next note, and for requesting deletion of the current note,
 * allowing a parent component to manage the actual note data and list navigation.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-note-dialog' - The HTML tag for this component (though typically
 *    instantiated via `MatDialog.open()`).
 *  - `standalone`: true - Indicates it's a standalone component.
 *  - `imports`: Lists necessary modules for its template, including `CommonModule`,
 *    `FormsModule` (for `[(ngModel)]`), Angular Material modules (`MatDialogModule`,
 *    `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatIconModule`),
 *    and `TextFieldModule` from CDK for enhanced text area capabilities.
 *  - `templateUrl`: './note-dialog.component.html' - Path to the component's HTML template.
 *  - `styleUrls`: ['./note-dialog.component.sass'] - Path to the component's Sass stylesheet(s).
 */
@Component({
  selector: 'app-note-dialog',
  templateUrl: './note-dialog.component.html',
  styleUrls: ['./note-dialog.component.sass'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TextFieldModule,
    MatIconModule
  ]
})
export class NoteDialogComponent {
  /**
   * Emits an event when the user requests to navigate to the previous note.
   * The parent component should handle the logic for displaying the previous note.
   */
  @Output() previousRequested = new EventEmitter<void>();
  /**
   * Emits an event when the user requests to navigate to the next note.
   * The parent component should handle the logic for displaying the next note.
   */
  @Output() nextRequested = new EventEmitter<void>();
  /**
   * Emits an event when the user requests to delete the current note.
   * The parent component should handle the actual deletion logic.
   */
  @Output() deleteRequested = new EventEmitter<void>();

  /**
   * Holds the text of the note currently being edited.
   * It's initialized with the text of the note passed in via `MAT_DIALOG_DATA`.
   * Bound to the text area in the template using `[(ngModel)]`.
   * @type {string}
   */
  editedText: string;

  /**
   * Constructs the NoteDialogComponent.
   *
   * @param {MatDialogRef<NoteDialogComponent, string | undefined>} dialogRef
   *   A reference to the dialog instance. This is used to control the dialog,
   *   primarily to close it. It can optionally return a result (the edited text string
   *   in this case, or `undefined` if no changes were made or cancel was clicked).
   *   Marked as `public` for potential template access, though typically interacted with via methods.
   * @param {NoteDialogData} data
   *   The data injected into the dialog, conforming to the `NoteDialogData` interface.
   *   This includes the `note` object and its positional context (`index`, `isFirst`, `isLast`).
   *   Marked as `public` for easy binding and access in the component's template and logic.
   */
  constructor(
    public dialogRef: MatDialogRef<NoteDialogComponent, string | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: NoteDialogData
  ) {
    this.editedText = data.note ? data.note.text : '';
  }

  /**
   * Handles the cancel action. Closes the dialog without returning any data,
   * indicating that no changes should be saved.
   */
  onCancel(): void {
    this.dialogRef.close(); // Closes with no result (undefined)
  }

  /**
   * Handles the save action.
   * If the `editedText` has been modified compared to the original note's text,
   * it closes the dialog and passes the `editedText` back as the result.
   * Otherwise (if no changes were made), it closes the dialog without returning data.
   */
  onSave(): void {
    if (this.editedText !== (this.data.note ? this.data.note.text : '')) {
      this.dialogRef.close(this.editedText); // Close with the edited text as a result
    } else {
      this.dialogRef.close(); // Close with no result (undefined) if no changes
    }
  }

  /**
   * Emits the `previousRequested` event to signal the parent component
   * that the user wants to navigate to the previous note.
   */
  onPreviousRequest(): void {
    this.previousRequested.emit();
  }

  /**
   * Emits the `nextRequested` event to signal the parent component
   * that the user wants to navigate to the next note.
   */
  onNextRequest(): void {
    this.nextRequested.emit();
  }

  /**
   * Emits the `deleteRequested` event to signal the parent component
   * that the user wants to delete the current note.
   */
  onDeleteRequest(): void {
    this.deleteRequested.emit();
  }

}
