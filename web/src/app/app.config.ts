/**
 * @fileoverview This file defines the application-level configuration for the
 * standalone Angular web application.
 *
 * The `appConfig` object exported from this file is used during the application's
 * bootstrap process (typically in `main.ts`) to provide essential services,
 * routing, animations, HTTP client setup (including interceptors), and
 * service worker registration. This centralized configuration approach is common
 * for applications bootstrapped with `bootstrapApplication`.
 */
import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { LoadingInterceptor } from './services/loading-interceptor.service';
import { provideServiceWorker } from '@angular/service-worker';

/**
 * Application configuration object for a standalone Angular application.
 *
 * This object is passed to `bootstrapApplication` to provide application-wide
 * dependency injection providers and features.
 *
 * @type {ApplicationConfig}
 * @property {Array<import('@angular/core').Provider|import('@angular/core').EnvironmentProviders>} providers
 *   An array of providers for configuring various Angular services and features:
 *   - `provideZoneChangeDetection({ eventCoalescing: true })`: Configures Angular's zone-based
 *     change detection with event coalescing enabled for performance optimization.
 *   - `provideRouter(routes)`: Sets up the Angular Router with the application routes
 *     defined in `app.routes.ts`.
 *   - `provideAnimations()`: Enables Angular's animation system.
 *   - `provideHttpClient(withInterceptorsFromDi())`: Provides the `HttpClient` for making
 *     HTTP requests and enables dependency injection for HTTP interceptors.
 *   - `HTTP_INTERCEPTORS` provider for `LoadingInterceptor`: Registers the custom
 *     `LoadingInterceptor`. This interceptor is likely used to manage a global loading
 *     indicator by tracking pending HTTP requests. `multi: true` allows multiple
 *     interceptors to be registered.
 *   - `provideServiceWorker('ngsw-worker.js', { ... })`: Configures the Angular service worker.
 *     - `enabled: !isDevMode()`: The service worker is enabled only in production mode
 *       (when `isDevMode()` is false).
 *     - `registrationStrategy: 'registerWhenStable:30000'`: Registers the service worker
 *       once the application becomes stable or after a 30-second timeout, whichever comes first.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptorsFromDi()
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true,
    }, provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};