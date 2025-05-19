// Angular Core
import { Injectable } from '@angular/core';

// Angular Material
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

// RxJS
import { Observable, map } from 'rxjs';

// Application-specific Components and Models
import { DialogComponent, DialogData } from '../dialog/dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private dialog: MatDialog) { }

  openDialog(data: DialogData): MatDialogRef<DialogComponent> {
    return this.dialog.open<DialogComponent, DialogData>(DialogComponent, {
      data: data,
    });
  }

  confirm(title: string, message: string, closeButtonText: string = 'OK'): Observable<boolean> {
    const dialogRef = this.openDialog({ title, message, closeButtonText });
    return dialogRef.afterClosed().pipe(map(result => !!result));
  }
}
