// Angular Core and Common
import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';

// Application-specific Components
import { SettingsDatabasesComponent } from '../settings-databases/settings-databases.component';
import { SettingsDominiumComponent } from '../settings-dominium/settings-dominium.component';
import { SettingsScoreComponent } from '../settings-score/settings-score.component';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    SettingsDatabasesComponent,
    SettingsScoreComponent,
    SettingsDominiumComponent,
    CommonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
/**
 * A top-level component that serves as a container for various application settings sections.
 * It orchestrates the display of different settings components like databases, score, and dominium.
 */
export class SettingsComponent {
  // Inietta ChangeDetectorRef
  private cdr = inject(ChangeDetectorRef);

  /**
   * A flag used to control the refresh mechanism for child components,
   * particularly for `SettingsDatabasesComponent`. Setting it to `false` then `true`
   * can force a re-rendering of a child component if it's wrapped in an `*ngIf="refresh"` directive.
   */
  refresh = true;

  /**
   * A boolean flag that likely controls the visibility or specific behavior
   * related to a "Dominium" settings section within the template.
   */
  dominium = false;

  /**
   * Updates the `dominium` property based on the provided boolean value.
   * This method is typically called by child components (e.g., `SettingsDominiumComponent`)
   * to communicate a state change upwards.
   * @param isDominium A boolean value indicating the new state for the `dominium` property.
   */
  dominiumIs(isDominium: boolean){
    console.log(`dominiumIs chiamata. Nuovo valore: ${isDominium}, valore precedente: ${this.dominium}`);
    this.dominium = isDominium;
    this.cdr.markForCheck(); // changed is now
    console.log('markForCheck() chiamata dopo dominiumIs.');
  }

  /**
   * Triggers a refresh cycle for child components that are dependent on the `refresh` flag.
   * It works by briefly setting `refresh` to `false` and then back to `true` within a timeout,
   * which can cause Angular's change detection to re-evaluate `*ngIf` directives
   * and re-initialize the wrapped components. This is often used when a child component's
   * state needs to be reset or reloaded due to external changes (e.g. database change).
   */
  databaseIsChanged() {
    console.log(`databaseIsChanged chiamata. Valore di refresh prima: ${this.refresh}`);
    this.refresh = false;
    this.cdr.markForCheck(); // refresh is true
    console.log(`refresh impostato a false, markForCheck() chiamata.`);

    setTimeout(() => {
      console.log(`Dentro setTimeout, prima di impostare refresh a true. Valore attuale: ${this.refresh}`);
      this.refresh = true;
      this.cdr.markForCheck(); // refresh is true
      console.log(`refresh impostato a true, markForCheck() chiamata.`);
    }, 0);
  }
}
