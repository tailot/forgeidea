// Angular Core
import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
// Angular Common
import { CommonModule, DOCUMENT } from '@angular/common';
// Angular Material Modules
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-settings-theme',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatCardModule],
  templateUrl: './settings-theme.component.html',
  styleUrl: './settings-theme.component.sass'
})
/**
 * Component for managing the application's visual theme (light or dark).
 * It provides a toggle to switch between themes and applies the selected theme
 * by adding or removing CSS classes on the document body.
 */
export class SettingsThemeComponent implements OnInit {
  /**
   * Represents the user's selected theme preference.
   * `true` indicates a preference for the dark theme, `false` for the light theme.
   * This property is typically bound to a UI toggle control.
   */
  isDarkMode: boolean = false;

  /**
   * Reflects the currently active theme state. In this component's current logic,
   * it mirrors the value of `isDarkMode`. It can be used for UI elements
   * that need to react to the active theme state.
   */
  isDarkModeActive: boolean = false;

  /** @private The CSS class name for the dark theme. */
  private readonly darkThemeClass = 'theme-dark';
  /** @private The CSS class name for the light theme. */
  private readonly lightThemeClass = 'theme-light';

  /**
   * Constructs the SettingsThemeComponent.
   * @param renderer Angular's Renderer2 service for safe DOM manipulation.
   * @param document The global document object, injected to allow direct manipulation of the body element.
   */
  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  /**
   * Initializes the component.
   * Applies the initial theme (based on the default `isDarkMode` value)
   * to the document body when the component loads.
   */
  ngOnInit(): void {
    this.applyTheme();
  }

  /**
   * Toggles the application theme between light and dark mode.
   * It updates the `isDarkMode` and `isDarkModeActive` states and then
   * calls `applyTheme()` to reflect the change in the UI.
   */
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.isDarkModeActive = this.isDarkMode; // Keep active state in sync with selected state
    this.applyTheme();
  }

  /**
   * Applies the currently selected theme (light or dark) to the document body.
   * It removes the class of the opposite theme and adds the class for the
   * current theme state (`isDarkMode`).
   * @private
   */
  private applyTheme(): void {
    this.renderer.removeClass(this.document.body, this.isDarkMode ? this.lightThemeClass : this.darkThemeClass);
    this.renderer.addClass(this.document.body, this.isDarkMode ? this.darkThemeClass : this.lightThemeClass);
  }
}
