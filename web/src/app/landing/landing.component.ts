/**
 * @fileoverview Defines the `LandingComponent` for the Angular web application.
 *
 * This component serves as an initial entry point or guard-like component.
 * Its primary responsibility is to check the platform on which the Angular
 * application is running. If it detects that the application is executing in a
 * browser environment, it performs an immediate client-side redirection to a
 * static `/landing.html` page. This is often used when the main Angular application
 * is intended to be loaded after a user interacts with a static landing page,
 * or if the `/landing.html` serves a specific purpose outside the Angular SPA's
 * direct routing (e.g., for SEO, simple information, or marketing before the
 * full app loads).
 *
 * If the application is not running in a browser (e.g., during Server-Side
 * Rendering - SSR), it logs a message to the console indicating that no
 * redirection is performed, allowing the SSR process to handle the route
 * as configured elsewhere. The component itself has an empty template as it's
 * not intended to render any UI.
 */
// Angular Core
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * A standalone component that acts as an initial landing point for the application.
 *
 * Its primary function is to determine if the application is running in a browser.
 * If it is, the component redirects the user to `/landing.html`. This is useful for
 * scenarios where a static landing page should be shown first before the main Angular
 * application takes over, or if the main application is served from a sub-path.
 * The component has an empty template because its sole purpose is this redirection logic,
 * not to render any content itself.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-landing' - The HTML tag used to embed this component (though typically
 *    it's used as a route component).
 *  - `standalone`: true - Indicates that this is a standalone component, managing its own
 *    dependencies.
 *  - `template`: '' - An empty template, as this component does not render any UI.
 *
 * Implements:
 *  - `OnInit`: Lifecycle hook used to perform the platform check and redirection
 *    logic as soon as the component is initialized.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  template: '', // No UI is rendered by this component directly.
})
export class LandingComponent implements OnInit {

  /**
   * Injected `PLATFORM_ID` token. Used to determine the platform (browser, server, etc.)
   * on which the application is currently running. This is crucial for the component's
   * redirection logic, which should only occur in a browser environment.
   * @private
   */
  private platformId = inject(PLATFORM_ID);

  /**
   * Angular lifecycle hook that is called after Angular has initialized all data-bound
   * properties of a directive.
   *
   * In this component, `ngOnInit` checks if the application is running on a browser platform.
   * - If it is a browser platform, it logs a message and then redirects the current
   *   window to `/landing.html` using `window.location.replace()`. This method is chosen
   *   for redirection as it replaces the current page in the session history, meaning
   *   the user won't be able to navigate back to this Angular route.
   * - If it is not a browser platform (e.g., during server-side rendering), it logs a
   *   message indicating that no redirection is performed.
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
        // console.log('LandingComponent: redirect to /landing.html'); // Original log
        window.location.replace('/landing.html');
    } else {
      console.log('LandingComponent: no redirection.'); // Logs when not in browser (e.g., SSR)
    }
  }
}
