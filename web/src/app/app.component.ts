/**
 * @fileoverview Defines the root component (`AppComponent`) of the Angular web application.
 *
 * This component serves as the main entry point for the application's UI,
 * orchestrating the display of global UI elements such as navigation,
 * loading indicators, and primary content routed through `<router-outlet>`.
 * It also initializes application-wide services, such as a console override
 * service and a loading service. The component manages a subscription to router
 * events to control the visibility of a loading indicator during navigation.
 */
// Angular Core, Common, and Router
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';

// Angular Material
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// RxJS
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Application-specific Components and Services
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';
import { ConsoleOverrideService } from './services/consoleoverride.service';
import { LoadingService } from './services/loading.service';
import { NotesComponent } from './notes/notes.component';

/**
 * The root component of the application.
 *
 * This component is bootstrapped as the main application view. It includes
 * common UI elements like a router outlet for page content, a loading spinner,
 * a bottom navigation bar, and a notes display area. It also handles global
 * concerns such as initializing certain services and managing a loading
 * indicator during route changes.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-root' - The HTML tag used to embed this component.
 *  - `standalone`: True (implied by the presence of the `imports` array directly in the decorator,
 *                  assuming modern Angular practices. If not standalone, this would be part of an NgModule).
 *  - `imports`:
 *    - `CommonModule`: Provides common Angular directives like `*ngIf`, `*ngFor`.
 *    - `RouterOutlet`: A directive that acts as a placeholder for displaying routed components.
 *    - `MatProgressSpinnerModule`: From Angular Material, used for showing a loading indicator.
 *    - `BottomNavComponent`: A custom component for application navigation.
 *    - `NotesComponent`: A custom component for displaying notes or messages.
 *  - `templateUrl`: './app.component.html' - Path to the component's HTML template.
 *  - `styleUrl`: './app.component.sass' - Path to the component's Sass stylesheet.
 *
 * Implements:
 *  - `OnInit`: Lifecycle hook for initialization logic.
 *  - `OnDestroy`: Lifecycle hook for cleanup logic.
 */
@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatProgressSpinnerModule,
    BottomNavComponent,
    NotesComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent implements OnInit, OnDestroy {
  /**
   * The title of the application.
   * This property can be used for display purposes in the component's template
   * (e.g., in the browser title bar or a header).
   */
  title = 'forge IDEA';

  /**
   * Holds the subscription to router events.
   * This is used to manage the lifecycle of the subscription and ensure it's
   * unsubscribed when the component is destroyed, preventing memory leaks.
   * It is initialized in `ngOnInit` and cleaned up in `ngOnDestroy`.
   * @private
   * @type {(Subscription | undefined)}
   */
  private routerSubscription: Subscription | undefined;

  /**
   * Constructs the AppComponent.
   *
   * @param {LoadingService} loadingService - Service to control the global loading indicator.
   *                                         Made public to be accessible from the template if needed.
   * @param {ConsoleOverrideService} consoleOverrideService - Service to override default console behavior.
   *                                                        Injected to ensure its instantiation and initialization.
   * @param {Router} router - Angular's Router service for navigation and router event access.
   */
  constructor(
    public loadingService: LoadingService,
    private consoleOverrideService: ConsoleOverrideService,
    private router: Router
  ) { }

  /**
   * Angular lifecycle hook that is called after data-bound properties of a directive are initialized.
   *
   * In this component, `ngOnInit` subscribes to router events. Specifically, it listens for
   * `NavigationStart` events. When such an event occurs, it calls `this.loadingService.hide()`
   * to ensure any global loading indicator is hidden at the beginning of a route change.
   * This handles cases where a loader might have been left active by a previous operation
   * or ensures a clean state before the new route's components potentially show their own loaders.
   */
  ngOnInit(): void {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      this.loadingService.hide();
    });
  }

  /**
   * Angular lifecycle hook that is called just before Angular destroys the directive or component.
   *
   * This method unsubscribes from the `routerSubscription` if it exists. This is a crucial
   * cleanup step to prevent memory leaks that could occur if the component is destroyed
   * but its subscription to router events remains active.
   */
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
