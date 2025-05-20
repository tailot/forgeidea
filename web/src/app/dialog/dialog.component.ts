// Angular Core and Common
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface DialogData {
  title?: string;
  message: string;
  closeButtonText?: string;
  height?: string;
  width?: string;
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
