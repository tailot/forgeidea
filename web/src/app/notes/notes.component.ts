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

export interface Note {
  text: string;
}

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
  notes: Note[] = [];
  isLoading: boolean = true;
  private readonly NOTES_STORAGE_KEY = 'notes';
  currentNoteIndex: number = 0;
  activeDialogRef: MatDialogRef<NoteDialogComponent, string | undefined> | null = null;
  private navigationInProgress = false;
  private componentDestroyed$ = new Subject<void>();

  constructor(
    private storageService: StorageService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadNotes();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  async openNotesDialog(initialIndex?: number): Promise<void> {
    await this.loadNotes();
    if (this.notes.length === 0) {
      this.currentNoteIndex = 0;
    } else if (initialIndex !== undefined && initialIndex >= 0 && initialIndex < this.notes.length) {
      this.currentNoteIndex = initialIndex;
    } else {
      this.currentNoteIndex = (this.currentNoteIndex >= 0 && this.currentNoteIndex < this.notes.length)
                              ? this.currentNoteIndex
                              : 0;
    }
    this.displayCurrentNoteInDialog();
  }

  private displayCurrentNoteInDialog(): void {
    if (this.activeDialogRef) {
      this.activeDialogRef.close();
    }

    const isCreatingNewNote = (this.notes.length === 0 && this.currentNoteIndex === 0) ||
                              this.currentNoteIndex >= this.notes.length;

    let noteForDialog: Note;
    let effectiveDialogIndex: number;

    if (isCreatingNewNote) {
      noteForDialog = { text: '' };
      effectiveDialogIndex = this.notes.length;
    } else {
      if (this.currentNoteIndex < 0 || this.currentNoteIndex >= this.notes.length) {
        console.error("Stato inconsistente: tentativo di modificare una nota con indice non valido:", this.currentNoteIndex);
        this.activeDialogRef = null;
        return;
      }
      noteForDialog = { ...this.notes[this.currentNoteIndex] };
      effectiveDialogIndex = this.currentNoteIndex;
    }

    const noteData: NoteDialogData = {
      note: noteForDialog,
      index: effectiveDialogIndex,
      isFirst: effectiveDialogIndex === 0,
      isLast: effectiveDialogIndex >= this.notes.length,
    };

    this.activeDialogRef = this.dialog.open<NoteDialogComponent, NoteDialogData, string | undefined>(
      NoteDialogComponent,
      {
        width: 'clamp(300px, 80vw, 600px)',
        data: noteData,
      }
    );

    const dialogRefForThisInstance = this.activeDialogRef;

    if (dialogRefForThisInstance && dialogRefForThisInstance.componentInstance) {
      const dialogInstance = dialogRefForThisInstance.componentInstance;

      dialogInstance.previousRequested.pipe(
        takeUntil(dialogRefForThisInstance.afterClosed()),
        takeUntil(this.componentDestroyed$)
      ).subscribe(() => {
        this.processNavigationRequest('previous', dialogInstance.editedText);
      });

      dialogInstance.nextRequested.pipe(
        takeUntil(this.activeDialogRef.afterClosed()),
        takeUntil(this.componentDestroyed$)
      ).subscribe(() => {
        this.processNavigationRequest('next', dialogInstance.editedText);
      });
    }

    dialogRefForThisInstance.afterClosed().pipe(takeUntil(this.componentDestroyed$)).subscribe(async result => {
      if (this.navigationInProgress) {
        this.navigationInProgress = false;
        return;
      }
      
      if (result !== undefined) {
        const noteBeingHandledIndex = effectiveDialogIndex;

        if (noteBeingHandledIndex >= this.notes.length) {
          if (result.trim() !== '') {
            const newNote: Note = { text: result };
            this.notes.push(newNote);
            try {
              await this.storageService.setItem(this.NOTES_STORAGE_KEY, this.notes);
              console.log(`New note created at index ${this.notes.length - 1} and notes saved.`);
              this.currentNoteIndex = this.notes.length - 1;
            } catch (error) {
              console.error('Error saving new note to storage:', error);
              this.notes.pop();
            }
          }
        } else {
          if (this.notes[noteBeingHandledIndex].text !== result) {
             await this.updateNoteText(noteBeingHandledIndex, result);
          }
        }
      }
      if (this.activeDialogRef === dialogRefForThisInstance) {
        this.activeDialogRef = null;
      }
    });
  }

  private async processNavigationRequest(direction: 'previous' | 'next', currentDialogText: string): Promise<void> {
    const dialogToClose = this.activeDialogRef;

    if (!dialogToClose) {
      console.warn('[NotesComponent] processNavigationRequest called but no active dialog to close.');
      return;
    }

    this.navigationInProgress = true;

    this.activeDialogRef = null;

    const noteIndexBeforeNavigation = this.currentNoteIndex;
    const originalText = (noteIndexBeforeNavigation < this.notes.length) ? this.notes[noteIndexBeforeNavigation].text : '';

    if (currentDialogText !== originalText) {
      await this.updateNoteText(noteIndexBeforeNavigation, currentDialogText, true);
    }
    
    dialogToClose.close();

    if (direction === 'previous') this.showPreviousNoteInternal();
    else if (direction === 'next') this.showNextNoteInternal();
  }

  async loadNotes(): Promise<void> {
    this.isLoading = true;
    try {
      const storedNotes = await this.storageService.getItem<Note[]>(this.NOTES_STORAGE_KEY);
      if (storedNotes) {
        this.notes = storedNotes;
      } else {
        this.notes = [];
      }
    } catch (error) {
      console.error('Error loading notes from storage:', error);
      this.notes = [];
    } finally {
      this.isLoading = false;
    }
  }

  async updateNoteText(index: number, newText: string, isNavigationSave: boolean = false): Promise<void> {
    if (index < 0) {
      console.error(`Invalid negative index: ${index}. Cannot update note.`);
      return;
    }

    if (index >= this.notes.length) {
      if (newText.trim() === '') return;
      this.notes.push({ text: newText });
    } else {
      this.notes[index].text = newText;
    }

    try {
      await this.storageService.setItem(this.NOTES_STORAGE_KEY, this.notes);
      if (!isNavigationSave) {
        console.log(`Note at index ${index} updated and notes saved.`);
      }
    } catch (error) {
      console.error('Error saving notes to storage after update:', error);
    }
  }

  private showPreviousNoteInternal(): void {
    if (this.currentNoteIndex > 0) {
      this.currentNoteIndex--;
      this.displayCurrentNoteInDialog();
    }
  }

  private showNextNoteInternal(): void {
    if (this.currentNoteIndex < this.notes.length) {
      this.currentNoteIndex++;
      this.displayCurrentNoteInDialog();
    }
  }

  showPreviousNote(): void {
    if (this.canNavigatePrevious) this.showPreviousNoteInternal();
  }

  showNextNote(): void {
    if (this.canNavigateNext) this.showNextNoteInternal();
  }

  get fabActionText(): string {
    return this.notes.length > 0 ? 'Apri Note' : 'Crea Nota';
  }

  get canNavigatePrevious(): boolean {
    return this.notes.length > 0 && this.currentNoteIndex > 0;
  }

  get canNavigateNext(): boolean {
    return this.currentNoteIndex < this.notes.length;
  }
}
