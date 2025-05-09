import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../services/storage.service';

interface KeyValueItem {
  key: string;
  value: any;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    MatSliderModule,
    FormsModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent {
  isBackingUp = false;
  isRestoring = false;
  scoreThreshold: number = 5;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.storageService.getItem('score').then(value => {
      if (value !== null && typeof value === 'number') {
        this.scoreThreshold = value; // Keep this as is, it's a variable name
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
    const valueToSave = this.scoreThreshold; // Keep this as is

    console.log(`'scoreThreshold' value changed to: ${valueToSave}. Attempting to save to database.`);

    this.storageService.setItem('score', valueToSave)
      .then(() => {
        console.log(`'score' setting (${valueToSave}) saved successfully to database.`);
      })
      .catch(error => {
        console.error(`Error saving 'score' setting (${valueToSave}) to database:`, error);
      });
  }

  async reinitializeDatabase(): Promise<void> {
    console.log('Clear database...');
    await this.storageService.clearAll()

  }
  async backupDatabase(): Promise<void> {
    this.isBackingUp = true;
    try {
      const backupData: KeyValueItem[] = await this.storageService.backupDatabase();

      if (backupData.length === 0) {
        this.isBackingUp = false;
        return;
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ideaflow_backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`Backup completed (${backupData.length} items). File downloaded.`);
    } catch (error) {
      console.error('Error during backup:', error);
    } finally {
      this.isBackingUp = false;
    }
  }

  triggerRestore(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.fileInput.nativeElement.click();
  }

  async handleRestoreFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      console.log('No file selected or selection cancelled.');
      return;
    }

    const file = input.files[0];
    if (file.type !== 'application/json') {
      console.error('Invalid file format. Please select a .json file.');
      input.value = '';
      return;
    }

    this.isRestoring = true;
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonString = e.target?.result as string;
        const backupData: KeyValueItem[] = JSON.parse(jsonString);

        if (!Array.isArray(backupData) || (backupData.length > 0 && (!backupData[0].hasOwnProperty('key') || !backupData[0].hasOwnProperty('value')))) {
          throw new Error('The JSON file content is not a valid array of {key, value} items.');
        }

        await this.storageService.restoreDatabase(backupData);

        console.log(`Restore completed (${backupData.length} items).`);
      } catch (error) {
        console.error('Error during restore:', error);
      } finally {
        this.isRestoring = false;
      }
    };

    reader.onerror = (e) => {
      console.error('Error reading file:', e);
      this.isRestoring = false;
    };

    reader.readAsText(file);
  }
}
