/**
 * @fileoverview This file contains unit tests for the `CardIdeaComponent`.
 *
 * It utilizes the Angular testing framework (`TestBed`) to configure a testing
 * environment suitable for the `CardIdeaComponent`. To isolate the component and
 * manage its dependencies, several Angular testing modules are imported:
 *  - `RouterTestingModule`: For mocking Angular's routing services.
 *  - `HttpClientTestingModule`: For mocking HTTP requests and responses.
 *  - `NoopAnimationsModule`: To disable animations, simplifying tests that might
 *    otherwise involve asynchronous animation events.
 * The tests aim to ensure the component's correct creation and behavior.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideZonelessChangeDetection } from '@angular/core';
import { CardIdeaComponent } from './card-idea.component';

/**
 * Test suite for the `CardIdeaComponent`.
 * This block groups together all the unit tests specific to the `CardIdeaComponent`.
 */
describe('CardIdeaComponent', () => {
  /**
   * Instance of the `CardIdeaComponent` being tested.
   * @type {CardIdeaComponent}
   */
  let component: CardIdeaComponent;
  /**
   * Test fixture for the `CardIdeaComponent`. Provides access to the component instance,
   * its associated DOM element, and various testing utilities.
   * @type {ComponentFixture<CardIdeaComponent>}
   */
  let fixture: ComponentFixture<CardIdeaComponent>;

  /**
   * Asynchronous setup function that runs before each test case (`it` block)
   * within this test suite.
   *
   * It configures the Angular `TestBed` for the `CardIdeaComponent`. This involves:
   * - Importing the `CardIdeaComponent` itself (as it's likely a standalone component).
   * - Importing `RouterTestingModule` to mock Angular's routing services.
   * - Importing `HttpClientTestingModule` to mock HTTP client interactions.
   * - Importing `NoopAnimationsModule` to disable animations, which can simplify testing
   *   by avoiding asynchronous operations related to animations.
   * After configuration, it compiles the component's resources if necessary.
   * Then, it creates an instance of the `CardIdeaComponent`, assigns it to `component`,
   * and the corresponding test fixture to `fixture`.
   * Finally, `fixture.detectChanges()` triggers initial data binding and lifecycle hooks.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardIdeaComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Test case to verify that the `CardIdeaComponent` instance is created successfully.
   *
   * It asserts that the `component` instance (initialized in `beforeEach`) is truthy,
   * indicating that it was created without errors during the `TestBed.createComponent` call.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
