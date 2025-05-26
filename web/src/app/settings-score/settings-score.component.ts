// Angular Core and Forms
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';

// Application-specific Services
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-settings-score',
  imports: [
    MatCardModule,
    MatSliderModule,
    FormsModule],
  templateUrl: './settings-score.component.html',
  styleUrl: './settings-score.component.sass'
})
/**
 * Component for managing score-related settings.
 * Specifically, it allows users to set and persist a "score threshold" value
 * using the StorageService.
 */
export class SettingsScoreComponent implements OnInit {
  /**
   * The current value of the score threshold.
   * This value is bound to a UI element (e.g., a slider) and is loaded from
   * and saved to storage. It defaults to 5 if no value is found in storage or
   * if there's an error during loading, though the load logic currently sets it to 0 in such cases.
   */
  scoreThreshold: number = 5;

  /**
   * Constructs the SettingsScoreComponent.
   * @param storageService Service for interacting with persistent storage to load/save the score threshold.
   */
  constructor(
    private storageService: StorageService
  ) { }

  /**
   * Initializes the component by loading the 'score' setting from storage.
   */
  ngOnInit(): void {
    this.loadScoreSetting();
  }
  
  /**
   * Loads the 'score' setting from the StorageService.
   * If a valid number is found, `scoreThreshold` is updated.
   * Otherwise, `scoreThreshold` is set to a default value (currently 0 in the implementation).
   * @private
   */
  private loadScoreSetting(): void {
    this.storageService.getItem<number>('score').then(value => {
      if (value !== undefined && value !== null && typeof value === 'number') {
        this.scoreThreshold = value;
        console.log(`'score' value loaded from database: ${this.scoreThreshold}`);
      } else {
        // Defaulting to 0 if not found or invalid, consider aligning with initial property value if different.
        this.scoreThreshold = 0;
        console.log(`No 'score' value found in database or invalid, using default: ${this.scoreThreshold}`);
      }
    }).catch(error => {
      console.error("Error loading 'score' setting from database:", error);
      this.scoreThreshold = 0; // Default in case of error
    });
  }

  /**
   * Handles the change event when the score threshold is modified in the UI.
   * It takes the current `scoreThreshold` value and saves it to persistent storage
   * using the StorageService under the key 'score'.
   */
  onScoreThresholdChange(): void {
    const valueToSave = this.scoreThreshold;
    console.log(`'scoreThreshold' value changed to: ${valueToSave}. Attempting to save to database.`);
    this.storageService.setItem('score', valueToSave)
      .then(() => {
        console.log(`'score' setting (${valueToSave}) saved successfully to database.`);
      })
      .catch(error => {
        console.error(`Error saving 'score' setting (${valueToSave}) to database:`, error);
      });
  }
}
