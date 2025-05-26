/**
 * @fileoverview This file contains unit tests for the `JobcardComponent`.
 *
 * It utilizes the Angular testing framework (`TestBed`) to configure a testing
 * environment suitable for the `JobcardComponent`. To isolate the component and
 * manage its dependencies effectively, several Angular testing modules are imported:
 *  - `RouterTestingModule`: For mocking Angular's routing services, which is
 *    particularly important if the component interacts with route parameters (e.g., an ID
 *    from the URL) or navigation.
 *  - `HttpClientTestingModule`: For mocking HTTP requests and responses, essential
 *    if the component fetches data from or sends data to a backend.
 * The tests aim to ensure the component's correct creation and behavior.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { JobcardComponent } from './jobcard.component';

/**
 * Test suite for the `JobcardComponent`.
 * This block groups together all the unit tests specific to the `JobcardComponent`.
 */
describe('JobcardComponent', () => {
  /**
   * Instance of the `JobcardComponent` being tested.
   * @type {JobcardComponent}
   */
  let component: JobcardComponent;
  /**
   * Test fixture for the `JobcardComponent`. Provides access to the component instance,
   * its associated DOM element, and various testing utilities.
   * @type {ComponentFixture<JobcardComponent>}
   */
  let fixture: ComponentFixture<JobcardComponent>;

  /**
   * Asynchronous setup function that runs before each test case (`it` block)
   * within this test suite.
   *
   * It configures the Angular `TestBed` for the `JobcardComponent`. This involves:
   * - Importing the `JobcardComponent` itself (as it's likely a standalone component).
   * - Importing `RouterTestingModule` to mock Angular's routing services. This is
   *   important because components like `JobcardComponent` often rely on `ActivatedRoute`
   *   to get route parameters (e.g., a job card ID). For more specific tests involving
   *   route parameters, `ActivatedRoute` would typically be provided with a mock value here.
   * - Importing `HttpClientTestingModule` to mock HTTP client interactions, in case
   *   the component fetches or sends data.
   * After configuration, it compiles the component's resources if necessary.
   * Then, it creates an instance of the `JobcardComponent`, assigns it to `component`,
   * and the corresponding test fixture to `fixture`.
   * Finally, `fixture.detectChanges()` triggers initial data binding and lifecycle hooks.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        JobcardComponent, // Assuming JobcardComponent is standalone
        RouterTestingModule,
        HttpClientTestingModule
      ]
      // providers: [
      //   { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ uuid: 'test-uuid' }) } } }
      // ] // Example of how ActivatedRoute might be mocked
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Test case to verify that the `JobcardComponent` instance is created successfully.
   *
   * It asserts that the `component` instance (initialized in `beforeEach`) is truthy,
   * indicating that it was created without errors during the `TestBed.createComponent` call.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
