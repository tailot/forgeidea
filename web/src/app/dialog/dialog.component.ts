/**
 * @fileoverview Defines the `DialogComponent` and its associated data interface `DialogData`.
 *
 * The `DialogComponent` is a reusable UI component designed to display modal dialogs,
 * typically using Angular Material's dialog service (`MatDialog`). It can be configured
 * with a title, message, and custom close button text. The component is standalone
 * and uses `ChangeDetectionStrategy.OnPush` for performance optimization. The `DialogData`
 * interface specifies the structure of the data that can be passed to this dialog
 * upon its creation.
 */
// Angular Core and Common
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

/**
 * Interface defining the structure for data that can be passed to the `DialogComponent`.
 * This allows for customization of the dialog's content and appearance.
 */
export interface DialogData {
  /** Optional title to be displayed at the top of the dialog. */
  title?: string;
  /** The main message or content to be displayed in the dialog body. This is mandatory. */
  message: string;
  /** Optional text for the close button. Defaults to a generic close if not provided. */
  closeButtonText?: string;
  /** Optional height for the dialog. Can be any valid CSS height string (e.g., '400px', '50%'). */
  height?: string;
  /** Optional width for the dialog. Can be any valid CSS width string (e.g., '600px', '80vw'). */
  width?: string;
}

/**
 * A standalone component for displaying a configurable modal dialog.
 *
 * This component is typically opened via Angular Material's `MatDialog` service.
 * It receives data (title, message, button text) through dependency injection
 * using the `MAT_DIALOG_DATA` token and uses `MatDialogRef` to control itself (e.g., close).
 * It employs `ChangeDetectionStrategy.OnPush` for performance.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-dialog' - The HTML tag for this component (though typically not used directly as it's created via service).
 *  - `standalone`: true - Indicates that this is a standalone component.
 *  - `imports`: An array of modules required by this component's template:
 *    - `CommonModule`: Provides common Angular directives.
 *    - `MatDialogModule`: Provides Material Design dialog components and directives.
 *    - `MatButtonModule`: For Material Design styled buttons.
 *  - `templateUrl`: './dialog.component.html' - Path to the component's HTML template.
 *  - `styleUrl`: './dialog.component.sass' - Path to the component's Sass stylesheet.
 *  - `changeDetection`: `ChangeDetectionStrategy.OnPush` - Optimizes change detection.
 */
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
  /**
   * Constructs the DialogComponent.
   *
   * @param {MatDialogRef<DialogComponent>} dialogRef - A reference to the dialog instance.
   *   This reference can be used to close the dialog or pass data back. It's public
   *   to be accessible, for instance, if the template needs to interact with it directly,
   *   though common practice is to call methods like `onClose()`.
   * @param {DialogData} data - The data passed to the dialog, injected using the
   *   `MAT_DIALOG_DATA` token. This data (`title`, `message`, `closeButtonText`, etc.)
   *   is used to populate the dialog's content. It's public for easy binding in the template.
   */
  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  /**
   * Closes the dialog.
   * This method is typically called when the user clicks the close button
   * defined in the dialog's template.
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
