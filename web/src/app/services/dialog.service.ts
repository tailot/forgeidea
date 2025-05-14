import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent, DialogData } from '../dialog/dialog.component';
import { Observable, map } from 'rxjs';

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
