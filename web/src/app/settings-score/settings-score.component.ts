import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

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
export class SettingsScoreComponent {
  scoreThreshold: number = 5;

  constructor(
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.loadScoreSetting();
  }
  
  private loadScoreSetting(): void {
    this.storageService.getItem<number>('score').then(value => {
      if (value !== undefined && value !== null && typeof value === 'number') {
        this.scoreThreshold = value;
        console.log(`'score' value loaded from database: ${this.scoreThreshold}`);
      } else {
        this.scoreThreshold = 0;
        console.log(`No 'score' value found in database or invalid, using default: ${this.scoreThreshold}`);
      }
    }).catch(error => {
      console.error("Error loading 'score' setting from database:", error);
      this.scoreThreshold = 0;
    });
  }

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
