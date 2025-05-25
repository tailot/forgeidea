/**
 * @fileoverview This file contains unit tests for the BottomNavComponent.
 *
 * It utilizes the Angular testing framework (`TestBed`) to set up a testing
 * environment for the `BottomNavComponent`. This allows for isolated testing
 * of the component's creation and behavior. `RouterTestingModule` is imported
 * to provide mock implementations for Angular's routing services, which the
 * `BottomNavComponent` might interact with (e.g., through `routerLink` directives).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing'; // <-- Import RouterTestingModule
import { BottomNavComponent } from './bottom-nav.component';

/**
 * Test suite for the `BottomNavComponent`.
 * This block groups together all the unit tests specific to the `BottomNavComponent`.
 */
describe('BottomNavComponent', () => {
  /**
   * Instance of the `BottomNavComponent` being tested.
   * @type {BottomNavComponent}
   */
  let component: BottomNavComponent;
  /**
   * Test fixture for the `BottomNavComponent`. Provides access to the component instance
   * and its associated DOM element.
   * @type {ComponentFixture<BottomNavComponent>}
   */
  let fixture: ComponentFixture<BottomNavComponent>;

  /**
   * Asynchronous setup function that runs before each test case (`it` block)
   * within this test suite.
   *
   * It configures the Angular `TestBed` for the `BottomNavComponent`. This involves:
   * - Importing the `BottomNavComponent` itself (as it's likely a standalone component).
   * - Importing `RouterTestingModule` to mock Angular's routing services,
   *   necessary if the component uses `routerLink` or other router directives.
   * After configuration, it compiles the component's resources.
   * Then, it creates an instance of the `BottomNavComponent`, assigns it to the `component`
   * variable, and assigns the corresponding test fixture to the `fixture` variable.
   * Finally, `fixture.detectChanges()` triggers initial data binding and lifecycle hooks.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BottomNavComponent,
        RouterTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottomNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Test case to verify that the `BottomNavComponent` instance is created successfully.
   *
   * It asserts that the `component` instance (initialized in `beforeEach`) is truthy,
   * indicating that it was created without errors during the `TestBed.createComponent` call.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
