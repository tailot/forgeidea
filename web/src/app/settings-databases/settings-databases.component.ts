import { Component, ElementRef, ViewChild, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

import { DialogData } from '../dialog/dialog.component'
import { StorageService } from '../services/storage.service';
import { DialogService } from '../services/dialog.service';

interface KeyValueItem {
  key: string;
  value: any;
}

@Component({
  selector: 'app-settings-databases',
  imports: [CommonModule, MatRadioModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule, FormsModule],
  templateUrl: './settings-databases.component.html',
  styleUrl: './settings-databases.component.sass'
})
export class SettingsDatabasesComponent implements OnInit {
  isBackingUp = false;
  isRestoring = false;

  initializedDbNames: string[] = [];
  currentDbName: string = '';
  isSwitchingDb: boolean = false;
  isCreatingDb: boolean = false;

  @Output() change: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private storageService: StorageService,
    private dialogService: DialogService
  ) { }

  showAlert(data: DialogData): void {
    const dialogRef = this.dialogService.openDialog({
      title: data.title,
      message: data.message,
      closeButtonText: data.closeButtonText
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed', result);
    });
  }
  async ngOnInit(): Promise<void> {
    await this.loadDatabaseState();
  }

  private async loadDatabaseState(): Promise<void> {
    this.initializedDbNames = await this.storageService.getInitializedDatabaseNames();
    this.currentDbName = await this.storageService.getCurrentDatabaseName();
    console.log('Loaded database state - Current DB:', this.currentDbName, 'Initialized DBs:', this.initializedDbNames);
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
      this.change.emit();
    } catch (error) {
      console.error(`Error switching to database '${newDbName}':`, error);
      this.currentDbName = this.storageService.getCurrentDatabaseName();
    } finally {
      this.isSwitchingDb = false;
    }
  }

  async reinitializeDatabase(): Promise<void> {
    const currentDbToClear = this.storageService.getCurrentDatabaseName();


    console.log(`Clearing all data in database: ${currentDbToClear}...`);
    try {
      await this.storageService.clearAll();
      this.showAlert({  
        title: "Delete",
        message: "Database is cleared.",
        closeButtonText: "OK"
      })
      this.change.emit();
      console.log(`All data in database '${currentDbToClear}' has been cleared.`);
    } catch (error) {
      console.error(`Error clearing database '${currentDbToClear}':`, error);
    }
  }

  async removeSelectedDatabase() {
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
      this.showAlert({
        title: 'Invalid file format',
        message: 'Please select a .json file.',
        closeButtonText: 'OK'
      });
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
        this.showAlert({
          title: 'Hurra! Restore completed',
          message: 'Database restored successfully!',
          closeButtonText: 'OK'
        })
        this.loadDatabaseState();
      } catch (error: any) {
        console.error('Error during restore:', error);
        this.showAlert({
          title: 'Error during restore',
          message: `Error during restore: ${error.message || 'Unknown error'}`,
          closeButtonText: 'OK'
        });
      } finally {
        this.isRestoring = false;
        input.value = '';
      }
    };

    reader.onerror = (e) => {
      console.error('Error reading file:', e);
      this.showAlert({
        title: 'Ops',
        message: 'Error reading file.',
        closeButtonText: 'OK'
      });
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
      this.change.emit();
      this.isCreatingDb = false;
    }
  }
}
