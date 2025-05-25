/**
 * @fileoverview This is the main entry point for the Angular web application.
 *
 * This file is responsible for initializing the Angular platform and bootstrapping
 * the root application component (`AppComponent`). It utilizes the `bootstrapApplication`
 * function from `@angular/platform-browser` and imports the application-specific
 * configuration (`appConfig`) and the root component (`AppComponent`) to start the application.
 * Any errors that occur during the bootstrapping process are caught and logged to the console.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Bootstraps the Angular application.
 * This function call initializes the Angular application by loading the root
 * component (`AppComponent`) along with its specific application configuration (`appConfig`).
 * If any errors occur during the bootstrapping process, they are caught and
 * logged to the standard error console.
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
