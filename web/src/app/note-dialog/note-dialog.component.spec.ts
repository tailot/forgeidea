/**
 * @fileoverview This file contains unit tests for the `NoteDialogComponent`.
 *
 * It utilizes the Angular testing framework (`TestBed`) to configure a testing
 * environment specifically for the `NoteDialogComponent`. Essential dependencies
 * for Angular Material dialogs, namely `MatDialogRef` (which allows control over
 * the opened dialog) and `MAT_DIALOG_DATA` (which provides data to the dialog),
 * are mocked. This approach enables isolated testing of the dialog component's
 * functionality, such as its creation, data binding, and interaction with the
 * dialog reference (e.g., closing the dialog).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { NoteDialogComponent } from './note-dialog.component';
import { NoteDialogData } from './note-dialog.component';

/**
 * Mock data object for providing `MAT_DIALOG_DATA` to the `NoteDialogComponent` during testing.
 * This simulates the data that the dialog would receive when opened, including a sample note,
 * its index, and flags indicating if it's the first or last note in a potential series.
 * @type {NoteDialogData}
 */
const mockDialogData: NoteDialogData = {
  note: { text: 'Test Note' },
  index: 0,
  isFirst: true,
  isLast: false,
};

/**
 * Mock object for `MatDialogRef`.
 * This provides a Jasmine spy for the `close` method, allowing tests to verify
 * if the dialog's `close` method is invoked as expected (e.g., when a close button is clicked).
 */
const mockMatDialogRef = {
  close: jasmine.createSpy('close'),
};

/**
 * Test suite for the `NoteDialogComponent`.
 * This block groups together all the unit tests specific to the `NoteDialogComponent`.
 */
describe('NoteDialogComponent', () => {
  /**
   * Instance of the `NoteDialogComponent` being tested.
   * @type {NoteDialogComponent}
   */
  let component: NoteDialogComponent;
  /**
   * Test fixture for the `NoteDialogComponent`. Provides access to the component instance,
   * its associated DOM element, and various testing utilities.
   * @type {ComponentFixture<NoteDialogComponent>}
   */
  let fixture: ComponentFixture<NoteDialogComponent>;

  /**
   * Asynchronous setup function that runs before each test case (`it` block)
   * within this test suite.
   *
   * It configures the Angular `TestBed` for the `NoteDialogComponent`. This involves:
   * - Importing the `NoteDialogComponent` itself (as it's likely a standalone component).
   * - Providing mock implementations for `MatDialogRef` and `MAT_DIALOG_DATA`
   *   using the `mockMatDialogRef` and `mockDialogData` objects. This is essential
   *   for testing the dialog component in isolation from the actual dialog service
   *   and without needing a real component to open it.
   * After configuration, it compiles the component's resources if necessary.
   * Then, it creates an instance of the `NoteDialogComponent`, assigns it to `component`,
   * and the corresponding test fixture to `fixture`.
   * Finally, `fixture.detectChanges()` triggers initial data binding and lifecycle hooks.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteDialogComponent], // Assuming NoteDialogComponent is standalone
      providers: [
        { provide: MatDialogRef, useValue: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Test case to verify that the `NoteDialogComponent` instance is created successfully.
   *
   * It asserts that the `component` instance (initialized in `beforeEach` with mock
   * dialog data and a mock dialog reference) is truthy, indicating that it was
   * created without errors.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
