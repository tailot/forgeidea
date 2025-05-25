/**
 * @fileoverview Defines the `BottomNavComponent` for the Angular web application.
 *
 * This component is responsible for rendering and managing the application's
 * bottom navigation bar. It provides users with primary navigation links,
 * displays the current online status of the application, and includes a theme
 * settings component. A key behavior of this component is to automatically
 * navigate the user to the '/list' route if the application detects that it
 * has gone offline. This ensures a consistent user experience when connectivity
 * is lost. The component uses `ChangeDetectionStrategy.OnPush` for performance
 * optimization.
 */
// Angular Core
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

// RxJS
import { Observable, Subscription } from 'rxjs';

import { OnlineStatusService } from '../services/onlinestatus.service';
import { SettingsThemeComponent } from '../settings-theme/settings-theme.component';

/**
 * A standalone component that renders the bottom navigation bar.
 *
 * This component displays navigation links, indicates the application's online status,
 * and embeds a theme settings component. It uses `ChangeDetectionStrategy.OnPush`
 * to optimize performance by limiting change detection cycles. The component also
 * implements `OnInit` and `OnDestroy` to manage subscriptions related to online
 * status and perform necessary cleanup.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-bottom-nav' - The HTML tag used to embed this component.
 *  - `standalone`: true - Indicates that this is a standalone component.
 *  - `imports`: An array of modules and components required by this component:
 *    - `CommonModule`: Provides common Angular directives like `*ngIf`, `*ngFor`.
 *    - `MatIconModule`: From Angular Material, for using Material icons.
 *    - `MatToolbarModule`: From Angular Material, for creating toolbar structures.
 *    - `RouterLink`: Directive for navigating to routes.
 *    - `RouterLinkActive`: Directive to add CSS classes to active router links.
 *    - `SettingsThemeComponent`: A custom component for theme selection.
 *  - `templateUrl`: './bottom-nav.component.html' - Path to the component's HTML template.
 *  - `styleUrl`: './bottom-nav.component.sass' - Path to the component's Sass stylesheet.
 *  - `changeDetection`: `ChangeDetectionStrategy.OnPush` - Optimizes change detection
 *    to run only when inputs change, an event occurs within the component, or explicitly marked.
 *
 * Implements:
 *  - `OnInit`: Lifecycle hook for initialization logic.
 *  - `OnDestroy`: Lifecycle hook for cleanup logic.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatToolbarModule, RouterLink, RouterLinkActive, SettingsThemeComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottomNavComponent implements OnInit, OnDestroy {
  /**
   * Observable that emits the current online status of the application.
   * True if online, false if offline. This can be used in the component's
   * template to visually indicate the connection status.
   * @type {Observable<boolean>}
   */
  isOnline$: Observable<boolean>;

  /**
   * Holds the subscription to the `isOnline$` observable from `OnlineStatusService`.
   * This is used to manage the lifecycle of the subscription, allowing for
   * unsubscribing when the component is destroyed to prevent memory leaks.
   * @private
   * @type {(Subscription | undefined)}
   */
  private onlineStatusSubscription: Subscription | undefined;

  /**
   * Constructs the BottomNavComponent.
   *
   * @param {OnlineStatusService} onlineStatusService - Service that provides an observable
   *   for tracking the application's online/offline status. It's made public to allow
   *   the template to directly subscribe to `isOnline$` via the async pipe if needed,
   *   though here it's primarily used to initialize the `isOnline$` property.
   * @param {Router} router - Angular's Router service, used for programmatic navigation
   *   (e.g., redirecting to '/list' when offline).
   */
  constructor(
    public onlineStatusService: OnlineStatusService,
    private router: Router
  ) {
    this.isOnline$ = this.onlineStatusService.isOnline$;
  }

  /**
   * Angular lifecycle hook called after component initialization.
   *
   * This method subscribes to the `isOnline$` observable from the `OnlineStatusService`.
   * If the application goes offline (i.e., `isOnline` emits `false`), it navigates
   * the user to the '/list' route. This provides a fallback or alternative view
   * when full functionality might be impaired due to lack of connectivity.
   */
  ngOnInit(): void {
    this.onlineStatusSubscription = this.onlineStatusService.isOnline$.subscribe(isOnline => {
      if (!isOnline) {
        this.router.navigate(['/list']);
      }
    });
  }

  /**
   * Angular lifecycle hook called just before the component is destroyed.
   *
   * This method unsubscribes from the `onlineStatusSubscription` if it exists.
   * This is essential for preventing memory leaks by ensuring that the subscription
   * does not persist after the component is removed from the DOM.
   */
  ngOnDestroy(): void {
    this.onlineStatusSubscription?.unsubscribe();
  }
}
