import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface DialogData {
  title?: string;
  message: string;
  closeButtonText?: string;
}

@Component({
  selector: 'app-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  standalone: true,
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
