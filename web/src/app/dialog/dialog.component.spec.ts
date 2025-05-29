/**
 * @fileoverview This file contains unit tests for the `DialogComponent`.
 *
 * It utilizes the Angular testing framework (`TestBed`) to configure a testing
 * environment suitable for the `DialogComponent`. Key dependencies for Angular
 * Material dialogs, specifically `MatDialogRef` (the reference to the dialog instance)
 * and `MAT_DIALOG_DATA` (the data passed to the dialog), are mocked to allow
 * for isolated testing of the component's behavior without needing to interact
 * with the actual dialog service or a parent component opening the dialog.
 * The tests aim to ensure the component's correct creation and potentially its
 * interaction with the dialog data and close actions.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideZonelessChangeDetection } from '@angular/core';

import { DialogComponent } from './dialog.component';

/**
 * Test suite for the `DialogComponent`.
 * This block groups together all the unit tests specific to the `DialogComponent`.
 */
describe('DialogComponent', () => {
  /**
   * Instance of the `DialogComponent` being tested.
   * @type {DialogComponent}
   */
  let component: DialogComponent;
  /**
   * Test fixture for the `DialogComponent`. Provides access to the component instance,
   * its associated DOM element, and various testing utilities.
   * @type {ComponentFixture<DialogComponent>}
   */
  let fixture: ComponentFixture<DialogComponent>;

  /**
   * Mock object for `MatDialogRef`.
   * This provides a spy for the `close` method, allowing tests to verify if
   * the dialog's close method is called as expected.
   */
  const mockMatDialogRef = {
    close: jasmine.createSpy('close')
  };

  /**
   * Mock data for `MAT_DIALOG_DATA`.
   * This simulates the data that would be passed to the dialog when it's opened,
   * allowing tests to verify how the component uses this injected data.
   */
  const mockDialogData = {
    title: 'Test Title',
    message: 'Test Message',
    closeButtonText: 'OK'
  };

  /**
   * Asynchronous setup function that runs before each test case (`it` block)
   * within this test suite.
   *
   * It configures the Angular `TestBed` for the `DialogComponent`. This involves:
   * - Importing the `DialogComponent` itself (as it's likely a standalone component).
   * - Providing mock implementations for `MatDialogRef` and `MAT_DIALOG_DATA`
   *   using the `mockMatDialogRef` and `mockDialogData` objects. This is crucial
   *   for testing the dialog component in isolation.
   * After configuration, it compiles the component's resources if necessary.
   * Then, it creates an instance of the `DialogComponent`, assigns it to `component`,
   * and the corresponding test fixture to `fixture`.
   * Finally, `fixture.detectChanges()` triggers initial data binding and lifecycle hooks.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogComponent], // Assuming DialogComponent is standalone
      providers: [
        { provide: MatDialogRef, useValue: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        provideZonelessChangeDetection()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Test case to verify that the `DialogComponent` instance is created successfully.
   *
   * It asserts that the `component` instance (initialized in `beforeEach` with mock
   * dialog data and a mock dialog reference) is truthy, indicating that it was
   * created without errors.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});