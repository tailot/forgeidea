import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
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
    FormsModule,
    MatRadioModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent {
  isBackingUp = false;
  isRestoring = false;
  scoreThreshold: number = 5;

  initializedDbNames: string[] = [];
  currentDbName: string = '';
  isSwitchingDb: boolean = false;
  isCreatingDb: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.loadScoreSetting();
    this.loadDatabaseState();
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

  private loadDatabaseState(): void {
    this.initializedDbNames = this.storageService.getInitializedDatabaseNames();
    this.currentDbName = this.storageService.getCurrentDatabaseName();
    console.log('Loaded database state - Current DB:', this.currentDbName, 'Initialized DBs:', this.initializedDbNames);
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

  async onDatabaseSelected(newDbName: string): Promise<void> {
    const previouslyActiveDb = this.storageService.getCurrentDatabaseName();
    if (newDbName === previouslyActiveDb) {
      console.log(`Database ${newDbName} is already active. No change needed.`);
      return;
    }

    console.log(`User selected database: ${newDbName}. Switching from ${previouslyActiveDb}...`);
    this.isSwitchingDb = true;
    try {
      await this.storageService.switchDatabase(newDbName);
      this.initializedDbNames = this.storageService.getInitializedDatabaseNames();
      console.log(`Successfully switched to database: ${this.storageService.getCurrentDatabaseName()}`);
    } catch (error) {
      console.error(`Error switching to database '${newDbName}':`, error);
      this.currentDbName = this.storageService.getCurrentDatabaseName();
    } finally {
      this.isSwitchingDb = false;
    }
  }

  async reinitializeDatabase(): Promise<void> {
    const currentDbToClear = this.storageService.getCurrentDatabaseName();
    if (!confirm(`Are you sure you want to delete all data in the database '${currentDbToClear}'? This action cannot be undone.`)) {
      return;
    }
    console.log(`Clearing all data in database: ${currentDbToClear}...`);
    try {
      await this.storageService.clearAll();
      console.log(`All data in database '${currentDbToClear}' has been cleared.`);
    } catch (error) {
      console.error(`Error clearing database '${currentDbToClear}':`, error);
    }
  }

  async removeSelectedDatabase(){
    this.storageService.deleteDatabase(this.currentDbName).then(() => {
      this.loadDatabaseState()
    })
  }

  async backupDatabase(): Promise<void> {
    this.isBackingUp = true;
    try {
      const backupData: KeyValueItem[] = await this.storageService.backupDatabase();

      if (backupData.length === 0) {
        this.isBackingUp = false;
        console.log('No data to backup from the current database.');
        return;
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
      a.href = url;
      a.download = `ideaflow_backup_${this.storageService.getCurrentDatabaseName()}_${timestamp}.json`;
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
      alert('Invalid file format. Please select a .json file.'); // User feedback
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
        alert('Database restored successfully!');
        this.loadScoreSetting();
      } catch (error: any) {
        console.error('Error during restore:', error);
        alert(`Error during restore: ${error.message || 'Unknown error'}`);
      } finally {
        this.isRestoring = false;
        input.value = '';
      }
    };

    reader.onerror = (e) => {
      console.error('Error reading file:', e);
      alert('Error reading file.');
      this.isRestoring = false;
      input.value = '';
    };

    reader.readAsText(file);
  }

  async newCollection(): Promise<void> {
    const timestamp = new Date().getTime();
    const databaseName = `forgeIDEA_${timestamp}`;

    console.log(`Attempting to create and switch to new database: ${databaseName}`);
    this.isCreatingDb = true;
    try {
      await this.storageService.createDatabase(databaseName);
      console.log(`Database '${databaseName}' created. Now switching...`);
      await this.storageService.switchDatabase(databaseName);

      this.currentDbName = this.storageService.getCurrentDatabaseName();
      this.initializedDbNames = this.storageService.getInitializedDatabaseNames();
      console.log(`Successfully created and switched to new database: ${this.currentDbName}`);
    } catch (error) {
      console.error(`Error creating or switching to database '${databaseName}':`, error);
      this.currentDbName = this.storageService.getCurrentDatabaseName();
      this.initializedDbNames = this.storageService.getInitializedDatabaseNames();
    } finally {
      this.isCreatingDb = false;
    }
  }
}
