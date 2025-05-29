/**
 * @fileoverview This file contains unit tests for the `LandingComponent`.
 *
 * It utilizes the Angular testing framework (`TestBed`) to configure a testing
 * environment for the `LandingComponent`. A key aspect of these tests is the
 * simulation of a non-browser platform by providing a mock value for `PLATFORM_ID`.
 * This allows for testing platform-specific logic within the component, such as
 * conditional redirection. The tests also employ `jasmine.spyOn` to monitor `console.log`
 * calls, verifying specific log messages under certain conditions.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';

import { LandingComponent } from './landing.component';

/**
 * Test suite for the `LandingComponent`.
 * This block groups together all the unit tests specific to the `LandingComponent`,
 * particularly focusing on its behavior regarding platform detection and initial actions.
 */
describe('LandingComponent', () => {
  /**
   * Instance of the `LandingComponent` being tested.
   * @type {LandingComponent}
   */
  let component: LandingComponent;
  /**
   * Test fixture for the `LandingComponent`. Provides access to the component instance,
   * its associated DOM element, and various testing utilities.
   * @type {ComponentFixture<LandingComponent>}
   */
  let fixture: ComponentFixture<LandingComponent>;
  /**
   * A Jasmine spy object attached to `console.log`.
   * Used to verify that specific messages are logged by the component under test.
   * @type {jasmine.Spy}
   */
  let consoleSpy: jasmine.Spy;

  /**
   * Asynchronous setup function that runs before each test case (`it` block)
   * within this test suite.
   *
   * It configures the Angular `TestBed` for the `LandingComponent`. This involves:
   * - Importing the `LandingComponent` itself (assuming it's standalone).
   * - Providing a mock value for `PLATFORM_ID` to simulate a non-browser (server) environment.
   *   This is crucial for testing the component's platform-specific logic.
   * After configuration, it compiles the component's resources if necessary.
   * It then creates a spy on `console.log` before creating the component instance.
   * Finally, it creates an instance of `LandingComponent`, assigns it to `component`,
   * assigns the test fixture to `fixture`, and triggers initial data binding and
   * lifecycle hooks (like `ngOnInit`) with `fixture.detectChanges()`.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent], // Assuming LandingComponent is standalone
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }, // Simulates a non-browser platform
        provideZonelessChangeDetection()
      ]
    })
    .compileComponents();

    consoleSpy = spyOn(console, 'log'); // Set up the spy before component creation and ngOnInit

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit will be called here
  });

  /**
   * Test case to verify that the `LandingComponent` instance is created successfully.
   *
   * It asserts that the `component` instance (initialized in `beforeEach`) is truthy,
   * indicating that it was created without errors.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Test case to verify the component's behavior when running on a non-browser platform.
   *
   * It checks if `console.log` was called with the specific message
   * "LandingComponent: no redirection.". This assertion relies on the `PLATFORM_ID`
   * being mocked as 'server' in the `beforeEach` setup, which should trigger
   * the component's logic to log this message instead of performing a browser-specific
   * redirection.
   */
  it('should not redirect and log "LandingComponent: no redirection." if not in browser', () => {
    expect(consoleSpy).toHaveBeenCalledWith('LandingComponent: no redirection.');
  });
});
