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

export interface NoteDialogData {
  note: Note;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

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
  @Output() previousRequested = new EventEmitter<void>();
  @Output() nextRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();

  editedText: string;

  constructor(
    public dialogRef: MatDialogRef<NoteDialogComponent, string | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: NoteDialogData
  ) {
    this.editedText = data.note ? data.note.text : '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.editedText !== (this.data.note ? this.data.note.text : '')) {
      this.dialogRef.close(this.editedText);
    } else {
      this.dialogRef.close();
    }
  }

  onPreviousRequest(): void {
    this.previousRequested.emit();
  }

  onNextRequest(): void {
    this.nextRequested.emit();
  }

  onDeleteRequest(): void {
    this.deleteRequested.emit();
  }

}
