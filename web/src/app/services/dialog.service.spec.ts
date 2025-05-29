/**
 * @fileoverview This file contains unit tests for the `DialogService`.
 *
 * It utilizes Angular's `TestBed` for dependency injection and setting up the
 * testing environment. The current tests primarily ensure that the `DialogService`
 * can be created and injected correctly. For more comprehensive testing of its
 * dialog-opening functionalities, Angular Material's `MatDialog` service, which
 * `DialogService` likely wraps, would typically be mocked.
 */
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { DialogService } from './dialog.service';

/**
 * Test suite for the `DialogService`.
 * This block groups together all the unit tests related to the `DialogService`.
 */
describe('DialogService', () => {
  /**
   * Instance of the `DialogService` that is being tested.
   * This variable is initialized before each test case in the `beforeEach` block.
   * @type {DialogService}
   */
  let service: DialogService;

  /**
   * Setup function that runs before each test case (`it` block) within this test suite.
   *
   * It configures the Angular `TestBed` for the service. In this basic setup,
   * it doesn't need to provide any specific testing modules or mock dependencies
   * beyond what `DialogService` itself might require for creation (e.g., `MatDialog`
   * would typically be mocked here for more detailed tests of its methods).
   * It then injects an instance of `DialogService` using `TestBed.inject()`,
   * making it available as `service` for each test.
   */
  beforeEach(() => {
    TestBed.configureTestingModule({
      // providers: [DialogService, { provide: MatDialog, useValue: mockMatDialog }, provideZonelessChangeDetection()] // Example for mocking MatDialog
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(DialogService);
  });

  /**
   * Test case to verify that the `DialogService` is created successfully.
   *
   * It uses `TestBed.inject` to get an instance of the service and then asserts
   * that the `service` instance is truthy, meaning it was created and injected
   * without errors.
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
