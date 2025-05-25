/**
 * @fileoverview Defines the `NotesComponent` and its associated `Note` interface
 * for the Angular web application.
 *
 * The `NotesComponent` is responsible for managing a collection of user notes.
 * It allows users to:
 *  - View a list of notes (though the primary interaction is via a dialog).
 *  - Open a dialog (`NoteDialogComponent`) to add a new note or edit an existing one.
 *  - Navigate between notes (previous/next) within the dialog context.
 *  - Delete notes.
 *
 * All notes are persisted to local storage using the `StorageService`.
 * The component uses Angular Material's `MatDialog` service to display the
 * `NoteDialogComponent` for detailed note interactions. It manages the state of
 * the current note being viewed/edited and handles the flow of data and events
 * between itself and the dialog.
 */
// Angular Core and Common
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Application-specific Components and Services
import { StorageService } from '../services/storage.service';
import { NoteDialogComponent, NoteDialogData } from '../note-dialog/note-dialog.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Interface representing a single note object.
 * Each note currently consists only of text content.
 */
export interface Note {
  /** The textual content of the note. */
  text: string;
}

/**
 * A standalone component for managing and displaying a list of notes.
 *
 * This component allows users to create, view, edit, and delete notes.
 * Notes are stored in local storage. Editing and viewing individual notes
 * is handled by opening a `NoteDialogComponent` using Angular Material's
 * `MatDialog` service. The component manages the overall list of notes,
 * the currently selected note index for dialog operations, and handles
 * navigation and deletion requests emitted from the dialog.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-notes' - The HTML tag used to embed this component.
 *  - `standalone`: true - Indicates that this is a standalone component.
 *  - `imports`: An array of modules required by this component's template:
 *    - `CommonModule`: Provides common Angular directives.
 *    - `MatDialogModule`: For using Angular Material dialogs.
 *    - `MatButtonModule`: For Material Design styled buttons.
 *    - `MatIconModule`: For using Material icons.
 *  - `templateUrl`: './notes.component.html' - Path to the component's HTML template.
 *  - `styleUrl`: './notes.component.sass' - Path to the component's Sass stylesheet.
 *
 * Implements:
 *  - `OnInit`: Lifecycle hook for initialization logic (e.g., loading notes).
 *  - `OnDestroy`: Lifecycle hook for cleanup logic (e.g., unsubscribing from observables).
 */
@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.sass'
})
export class NotesComponent implements OnInit {
  /** Array holding all the notes currently managed by the component. */
  notes: Note[] = [];
  /** Boolean flag to indicate if notes are currently being loaded (e.g., from storage). */
  isLoading: boolean = true;
  /** The key used for storing and retrieving notes from local storage. */
  private readonly NOTES_STORAGE_KEY = 'notes';
  /** The index of the note currently being viewed or edited in the dialog. */
  currentNoteIndex: number = 0;
  /**
   * Reference to the currently active `NoteDialogComponent` instance.
   * Null if no dialog is open. Used to manage dialog lifecycle and prevent multiple dialogs.
   * @type {(MatDialogRef<NoteDialogComponent, string | undefined> | null)}
   */
  activeDialogRef: MatDialogRef<NoteDialogComponent, string | undefined> | null = null;
  /**
   * Flag to prevent race conditions or unintended actions when dialog navigation
   * (previous/next) is triggered, which involves closing and reopening a dialog.
   * @private
   */
  private navigationInProgress = false;
  /**
   * Subject used to manage the teardown of observable subscriptions when the component is destroyed.
   * Helps prevent memory leaks.
   * @private
   */
  private componentDestroyed$ = new Subject<void>();

  /**
   * Constructs the NotesComponent.
   * @param {StorageService} storageService - Service for interacting with local storage to persist notes.
   * @param {MatDialog} dialog - Angular Material's service for opening dialog components.
   */
  constructor(
    private storageService: StorageService,
    private dialog: MatDialog
  ) { }

  /**
   * Angular lifecycle hook called after component initialization.
   * Loads notes from storage when the component is initialized.
   */
  ngOnInit(): void {
    this.loadNotes();
  }

  /**
   * Angular lifecycle hook called just before the component is destroyed.
   * Completes the `componentDestroyed$` subject to trigger unsubscription
   * from any active observables, preventing memory leaks.
   */
  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  /**
   * Opens the `NoteDialogComponent` to display or create a note.
   * It first loads all notes to ensure data consistency.
   * Determines the correct note and index to display, handling cases for
   * new notes, existing notes, or empty note lists.
   *
   * @param {number} [initialIndex] - Optional index of the note to display.
   *                                  If not provided, it uses `currentNoteIndex` or defaults to 0.
   *                                  If it's for a new note, this might be `notes.length`.
   * @async
   */
  async openNotesDialog(initialIndex?: number): Promise<void> {
    await this.loadNotes(); // Ensure notes are fresh before opening dialog
    if (this.notes.length === 0) {
      this.currentNoteIndex = 0; // For creating the first note
    } else if (initialIndex !== undefined && initialIndex >= 0 && initialIndex < this.notes.length) {
      this.currentNoteIndex = initialIndex;
    } else {
      // Default to currentNoteIndex if valid, else 0.
      this.currentNoteIndex = (this.currentNoteIndex >= 0 && this.currentNoteIndex < this.notes.length)
        ? this.currentNoteIndex
        : 0;
    }
    this.displayCurrentNoteInDialog();
  }

  /**
   * Core logic for displaying the `NoteDialogComponent` with the current note's data.
   * If a dialog is already active, it's closed first.
   * It prepares `NoteDialogData` based on whether it's a new note or an existing one.
   * Subscribes to events from the dialog instance (`previousRequested`, `nextRequested`, `deleteRequested`)
   * and its `afterClosed` event to handle user actions and save data.
   * @private
   */
  private displayCurrentNoteInDialog(): void {
    if (this.activeDialogRef) {
      // console.log('[NotesComponent] Closing existing dialog before opening new one.');
      this.activeDialogRef.close(); // Close existing dialog if any
    }

    const isCreatingNewNote = (this.notes.length === 0 && this.currentNoteIndex === 0) ||
      this.currentNoteIndex >= this.notes.length;

    let noteForDialog: Note;
    let effectiveDialogIndex: number;

    if (isCreatingNewNote) {
      noteForDialog = { text: '' }; // Start with an empty note for creation
      effectiveDialogIndex = this.notes.length; // Index for a new note
      // console.log(`[NotesComponent] Preparing dialog for new note at index ${effectiveDialogIndex}`);
    } else {
      if (this.currentNoteIndex < 0 || this.currentNoteIndex >= this.notes.length) {
        console.error("[NotesComponent] Inconsistent state: attempt to display note with invalid index:", this.currentNoteIndex);
        this.activeDialogRef = null; // Ensure no stale ref
        return;
      }
      noteForDialog = { ...this.notes[this.currentNoteIndex] }; // Use a copy to prevent direct modification
      effectiveDialogIndex = this.currentNoteIndex;
      // console.log(`[NotesComponent] Preparing dialog for existing note at index ${effectiveDialogIndex}`);
    }

    const noteData: NoteDialogData = {
      note: noteForDialog,
      index: effectiveDialogIndex,
      isFirst: effectiveDialogIndex === 0,
      // For a new note, 'isLast' should be true as it's conceptually at the end.
      isLast: effectiveDialogIndex >= this.notes.length - (isCreatingNewNote ? 0 : 1),
    };

    this.activeDialogRef = this.dialog.open<NoteDialogComponent, NoteDialogData, string | undefined>(
      NoteDialogComponent,
      {
        width: 'clamp(300px, 80vw, 600px)', // Responsive width
        data: noteData,
        disableClose: true, // Prevent closing by Escape key or clicking outside
      }
    );

    const dialogRefForThisInstance = this.activeDialogRef; // Capture the current dialogRef

    // Subscribe to events from the dialog instance
    if (dialogRefForThisInstance && dialogRefForThisInstance.componentInstance) {
      const dialogInstance = dialogRefForThisInstance.componentInstance;

      dialogInstance.previousRequested.pipe(
        takeUntil(dialogRefForThisInstance.afterClosed()), // Unsubscribe when this specific dialog closes
        takeUntil(this.componentDestroyed$) // Also unsubscribe on component destroy
      ).subscribe(() => {
        this.processNavigationRequest('previous', dialogInstance.editedText);
      });

      dialogInstance.nextRequested.pipe(
        takeUntil(dialogRefForThisInstance.afterClosed()), // Changed from this.activeDialogRef
        takeUntil(this.componentDestroyed$)
      ).subscribe(() => {
        this.processNavigationRequest('next', dialogInstance.editedText);
      });

      dialogInstance.deleteRequested.pipe(
        takeUntil(dialogRefForThisInstance.afterClosed()),
        takeUntil(this.componentDestroyed$)
      ).subscribe(() => {
        if (effectiveDialogIndex < this.notes.length) { // Only delete if it's an existing note
          // this.currentNoteIndex = effectiveDialogIndex; // Ensure currentNoteIndex is set before delete
          this.deleteNoteAndRefreshDialog(effectiveDialogIndex); // Pass the correct index
        } else {
          // console.warn("[NotesComponent] Delete requested for a new/non-existent note from dialog, closing dialog.");
          if (this.activeDialogRef === dialogRefForThisInstance) { // Ensure we're closing the correct dialog
            dialogRefForThisInstance.close();
            this.activeDialogRef = null;
          }
        }
      });
    }

    dialogRefForThisInstance.afterClosed().pipe(takeUntil(this.componentDestroyed$)).subscribe(async result => {
      if (this.navigationInProgress) {
        // console.log('[NotesComponent] Dialog closed during navigation, navigation will handle next step.');
        this.navigationInProgress = false; // Reset flag
        return; // Skip default afterClosed logic if navigation was the cause
      }

      // `result` is the text from the dialog's text area, or undefined if canceled without changes or just closed.
      if (result !== undefined) { // `undefined` means no changes or cancel, `string` means save (even if empty)
        const noteBeingHandledIndex = effectiveDialogIndex;

        if (noteBeingHandledIndex >= this.notes.length) { // This was a new note attempt
          if (result.trim() !== '') { // Only save if there's actual text
            const newNote: Note = { text: result };
            this.notes.push(newNote);
            try {
              await this.storageService.setItem(this.NOTES_STORAGE_KEY, this.notes);
              // console.log(`[NotesComponent] New note created at index ${this.notes.length - 1} and notes saved.`);
              this.currentNoteIndex = this.notes.length - 1; // Update index to the new note
            } catch (error) {
              console.error('[NotesComponent] Error saving new note to storage:', error);
              this.notes.pop(); // Revert optimistic add if save fails
            }
          }
        } else { // This was an existing note
          // Only update if text actually changed
          if (this.notes[noteBeingHandledIndex].text !== result) {
            await this.updateNoteText(noteBeingHandledIndex, result);
          }
        }
      }
      // Ensure activeDialogRef is cleared only if it's the one that just closed
      if (this.activeDialogRef === dialogRefForThisInstance) {
        this.activeDialogRef = null;
      }
    });
  }

  /**
   * Processes a navigation request (previous/next) from the note dialog.
   * Saves the current dialog's text if modified, closes the current dialog,
   * and then opens the dialog for the adjacent note.
   * @param {'previous' | 'next'} direction - The direction of navigation.
   * @param {string} currentDialogText - The text content from the currently open dialog.
   * @private
   * @async
   */
  private async processNavigationRequest(direction: 'previous' | 'next', currentDialogText: string): Promise<void> {
    const dialogToClose = this.activeDialogRef; // Capture ref before it's nulled

    if (!dialogToClose) {
      // console.warn('[NotesComponent] processNavigationRequest called but no active dialog to close.');
      return;
    }

    this.navigationInProgress = true; // Signal that navigation is handling the close

    // Important: Nullify activeDialogRef before potentially saving,
    // as save might trigger other logic that checks activeDialogRef.
    this.activeDialogRef = null;

    // Save current note's text if it was modified
    // currentNoteIndex should still point to the note that was in the dialog being closed.
    const noteIndexBeforeNavigation = this.currentNoteIndex;
    // Check if the note actually exists at this index (it might be a new note not yet added to `this.notes`)
    const originalText = (noteIndexBeforeNavigation < this.notes.length)
      ? this.notes[noteIndexBeforeNavigation].text
      : ''; // If it was a new note, original text is empty

    if (currentDialogText !== originalText) {
      // If it was a new note being created (index >= length), and text is not empty, add it.
      // Otherwise, update existing.
      await this.updateNoteText(noteIndexBeforeNavigation, currentDialogText, true); // Pass true for isNavigationSave
    }

    dialogToClose.close(); // Close the dialog *after* potential save and *before* opening next
    // this.navigationInProgress = false; // Reset immediately after explicit close

    // Proceed to open the next/previous dialog
    if (direction === 'previous') this.showPreviousNoteInternal();
    else if (direction === 'next') this.showNextNoteInternal();
  }

  /**
   * Deletes the note at the specified index and refreshes the dialog view.
   * If the deleted note was the last one, it adjusts `currentNoteIndex`
   * and re-opens the dialog for the new current note or an empty state.
   * @param {number} indexToDelete - The index of the note to delete.
   * @private
   * @async
   */
  private async deleteNoteAndRefreshDialog(indexToDelete: number): Promise<void> {
    if (indexToDelete < 0 || indexToDelete >= this.notes.length) {
      // console.warn('[NotesComponent] Attempt to delete a note with an invalid index:', indexToDelete);
      if (this.activeDialogRef) this.activeDialogRef.close(); // Close if open
      this.activeDialogRef = null;
      return;
    }

    const dialogToClose = this.activeDialogRef; // Capture before nulling
    this.navigationInProgress = true; // Prevent afterClosed from re-saving
    this.activeDialogRef = null;

    this.notes.splice(indexToDelete, 1); // Remove the note

    try {
      await this.storageService.setItem(this.NOTES_STORAGE_KEY, this.notes);
      // console.log(`[NotesComponent] Note at index ${indexToDelete} deleted and notes saved.`);
    } catch (error) {
      console.error('[NotesComponent] Error saving notes after deletion:', error);
      // Potentially revert splice or handle error more gracefully
    }

    if (dialogToClose) {
      dialogToClose.close();
    }
    this.navigationInProgress = false; // Reset flag

    // Adjust currentNoteIndex and re-display or show new note dialog
    if (this.notes.length === 0) {
      this.currentNoteIndex = 0; // For creating a new note if list becomes empty
      // Optionally, immediately open dialog for new note, or let user click "add"
      // this.displayCurrentNoteInDialog(); // Or a more specific "showNewNoteDialog"
    } else {
      // If we deleted a note that was beyond the new list length, or the last note
      if (indexToDelete >= this.notes.length) {
        this.currentNoteIndex = this.notes.length - 1; // Point to the new last note
      } else {
        // Otherwise, the note at indexToDelete is now the new current note (or next one)
        this.currentNoteIndex = indexToDelete;
      }
      this.displayCurrentNoteInDialog(); // Refresh dialog with the new current note
    }
  }

  /**
   * Asynchronously loads notes from local storage using `StorageService`.
   * Updates the `notes` array and sets `isLoading` state.
   * @async
   */
  async loadNotes(): Promise<void> {
    this.isLoading = true;
    try {
      const storedNotes = await this.storageService.getItem<Note[]>(this.NOTES_STORAGE_KEY);
      if (storedNotes) {
        this.notes = storedNotes;
      } else {
        this.notes = []; // Initialize with empty array if nothing in storage
      }
    } catch (error) {
      console.error('Error loading notes from storage:', error);
      this.notes = []; // Default to empty array on error
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Updates the text of a note at a given index or adds a new note if the index is out of bounds.
   * Persists the updated notes list to local storage.
   * @param {number} index - The index of the note to update. If >= `notes.length`, a new note is added.
   * @param {string} newText - The new text for the note.
   * @param {boolean} [isNavigationSave=false] - Flag to indicate if this save is part of a
   *   dialog navigation action, used to suppress console logging for routine saves during navigation.
   * @async
   */
  async updateNoteText(index: number, newText: string, isNavigationSave: boolean = false): Promise<void> {
    if (index < 0) {
      // console.error(`Invalid negative index: ${index}. Cannot update note.`);
      return; // Or handle error appropriately
    }

    if (index >= this.notes.length) { // Attempting to save a new note
      if (newText.trim() === '' && isNavigationSave) return; // Don't save empty new note during navigation
      if (newText.trim() === '' && !isNavigationSave) return; // Don't save if user explicitly saves an empty new note (unless desired)
      this.notes.push({ text: newText });
    } else { // Updating existing note
      this.notes[index].text = newText;
    }

    try {
      await this.storageService.setItem(this.NOTES_STORAGE_KEY, this.notes);
      if (!isNavigationSave) {
        // console.log(`Note at index ${index} updated and notes saved.`);
      }
    } catch (error) {
      console.error('Error saving notes to storage after update:', error);
      // Potentially revert the change in this.notes or handle error
    }
  }

  /**
   * Internal logic to decrement `currentNoteIndex` and display the note at the new index.
   * @private
   */
  private showPreviousNoteInternal(): void {
    if (this.currentNoteIndex > 0) {
      this.currentNoteIndex--;
      this.displayCurrentNoteInDialog();
    }
  }

  /**
   * Internal logic to increment `currentNoteIndex` and display the note at the new index
   * or a new note dialog if at the end.
   * @private
   */
  private showNextNoteInternal(): void {
    // currentNoteIndex can be equal to notes.length when preparing for a new note
    if (this.currentNoteIndex < this.notes.length) {
      this.currentNoteIndex++;
      this.displayCurrentNoteInDialog();
    }
  }

  /**
   * Public method to navigate to the previous note, if possible.
   * Checks `canNavigatePrevious` before calling internal navigation logic.
   */
  showPreviousNote(): void {
    if (this.canNavigatePrevious) this.showPreviousNoteInternal();
  }

  /**
   * Public method to navigate to the next note or a new note entry, if possible.
   * Checks `canNavigateNext` before calling internal navigation logic.
   */
  showNextNote(): void {
    if (this.canNavigateNext) this.showNextNoteInternal();
  }

  /**
   * Getter to determine if navigation to a previous note is possible.
   * @returns {boolean} True if not the first note and notes exist.
   */
  get canNavigatePrevious(): boolean {
    return this.notes.length > 0 && this.currentNoteIndex > 0;
  }

  /**
   * Getter to determine if navigation to a next note (or a new note) is possible.
   * Allows navigation to one position beyond the current list length to add a new note.
   * @returns {boolean} True if not at the very end of conceptual note sequence (list + new).
   */
  get canNavigateNext(): boolean {
    // Allows navigating to "add new" if currentNoteIndex is the last actual note's index
    return this.currentNoteIndex < this.notes.length;
  }
}
