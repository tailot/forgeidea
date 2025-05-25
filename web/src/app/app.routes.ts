/**
 * @fileoverview This file defines the primary routing configuration for the Angular web application.
 *
 * It contains an array of `Route` objects that map URL paths to specific Angular components.
 * Most routes utilize lazy loading (`loadComponent`) to dynamically import components only when
 * they are navigated to, which helps improve the initial load performance of the application.
 * The routes include paths for core application features such as idea generation,
 * category management, viewing job cards, listing ideas, application settings,
 * shared ideas, as well as informational pages like privacy policy and terms of service.
 * A wildcard route is also defined to redirect any unmatched paths to the application's
 * root path.
 */
import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';

/**
 * Defines the routing configuration for the application.
 *
 * This array of `Route` objects maps URL paths to Angular components.
 * It includes routes for the main landing page, various feature components
 * (mostly lazy-loaded), and a wildcard route for redirecting undefined paths.
 *
 * @type {Routes}
 * @property {object} routes[0] - Route for the root path ('').
 * @property {string} routes[0].path - The URL path (empty for root).
 * @property {typeof LandingComponent} routes[0].component - The component to display for the root path.
 *
 * @property {object} routes[1] - Route for '/generate'.
 * @property {string} routes[1].path - The URL path.
 * @property {Function} routes[1].loadComponent - Dynamically loads `BottonIdeaComponent`.
 * @property {string} routes[1].title - Browser title for this route.
 *
 * @property {object} routes[2] - Route for '/generateCategory'.
 * @property {string} routes[2].path - The URL path.
 * @property {Function} routes[2].loadComponent - Dynamically loads `GenerateCategoryComponent`.
 * @property {string} routes[2].title - Browser title for this route.
 *
 * @property {object} routes[3] - Route for '/jobcard/:uuid'.
 * @property {string} routes[3].path - The URL path, including a dynamic `uuid` parameter.
 * @property {Function} routes[3].loadComponent - Dynamically loads `JobcardComponent`.
 * @property {string} routes[3].title - Browser title for this route.
 *
 * @property {object} routes[4] - Route for '/list'.
 * @property {string} routes[4].path - The URL path.
 * @property {Function} routes[4].loadComponent - Dynamically loads `IdeaListComponent`.
 * @property {string} routes[4].title - Browser title for this route.
 *
 * @property {object} routes[5] - Route for '/settings'.
 * @property {string} routes[5].path - The URL path.
 * @property {Function} routes[5].loadComponent - Dynamically loads `SettingsComponent`.
 * @property {string} routes[5].title - Browser title for this route.
 *
 * @property {object} routes[6] - Route for '/shared'.
 * @property {string} routes[6].path - The URL path.
 * @property {Function} routes[6].loadComponent - Dynamically loads `SharedIdeaComponent`.
 * @property {string} routes[6].title - Browser title for this route.
 *
 * @property {object} routes[7] - Route for '/privacy-policy'.
 * @property {string} routes[7].path - The URL path.
 * @property {Function} routes[7].loadComponent - Dynamically loads `PrivacyPolicyComponent`.
 * @property {string} routes[7].title - Browser title for this route.
 *
 * @property {object} routes[8] - Route for '/tos'.
 * @property {string} routes[8].path - The URL path.
 * @property {Function} routes[8].loadComponent - Dynamically loads `TosComponent`.
 * @property {string} routes[8].title - Browser title for this route.
 *
 * @property {object} routes[9] - Wildcard route.
 * @property {string} routes[9].path - Matches any path not previously matched ('**').
 * @property {string} routes[9].redirectTo - Redirects to the root path ('').
 * @property {'full'} routes[9].pathMatch - Ensures the full path is matched for redirection.
 */
export const routes: Routes = [
    {
        path: '',
        component: LandingComponent
    },
    {
        path: 'generate',
        loadComponent: () => import('./botton-idea/botton-idea.component').then(m => m.BottonIdeaComponent),
        title: 'forge IDEA'
    },
    {
        path: 'generateCategory',
        loadComponent: () => import('./generate-category/generate-category.component').then(m => m.GenerateCategoryComponent),
        title: 'forge IDEA'
    },
    {
        path: 'jobcard/:uuid',
        loadComponent: () => import('./jobcard/jobcard.component').then(m => m.JobcardComponent),
        title: 'forge IDEA'
    },
    {
        path: 'list',
        loadComponent: () => import('./idea-list/idea-list.component').then(m => m.IdeaListComponent),
        title: 'forge IDEA'
    },
    {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
        title: 'forge IDEA'
    },
    {
        path: 'shared',
        loadComponent: () => import('./sharedidea/sharedidea.component').then(m => m.SharedIdeaComponent),
        title: 'forge IDEA'
    },
    {
        path: 'privacy-policy',
        loadComponent: () => import('./privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
        title: 'Privacy Policy - forge IDEA'
    },
    {
        path: 'tos',
        loadComponent: () => import('./tos/tos.component').then(m => m.TosComponent),
        title: 'Terms of service - forge IDEA'
    },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];
