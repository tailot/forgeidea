// Angular Core
import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
// Angular Common
import { CommonModule } from '@angular/common';
// Angular Forms
import { FormsModule } from '@angular/forms';
// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';

// Application-specific Components and Services
import { DialogData } from '../dialog/dialog.component';
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
    console.log('SettingsDatabasesComponent: ngOnInit started. Waiting for StorageService to be ready...');
    await this.storageService.whenReady();
    console.log('SettingsDatabasesComponent: StorageService is ready. Loading database state.');
    await this.loadDatabaseState();
  }

  private async loadDatabaseState(): Promise<void> {
    this.initializedDbNames = this.storageService.getInitializedDatabaseNames();
    this.currentDbName = this.storageService.getCurrentDatabaseName();
    console.log('SettingsDatabasesComponent: Loaded database state - Current DB:', this.currentDbName, 'Initialized DBs:', this.initializedDbNames.join(', '));
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
      this.currentDbName = this.storageService.getCurrentDatabaseName();
      console.log(`Successfully switched to database: ${this.storageService.getCurrentDatabaseName()}`);
      await this.setDefaultDbForAll(newDbName);
      this.change.emit();

    } catch (error) {
      console.error(`Error switching to database '${newDbName}':`, error);
      await this.loadDatabaseState();
    } finally {
      this.isSwitchingDb = false;
    }
  }

  async reinitializeDatabase(): Promise<void> {
    const currentDbToClear = this.storageService.getCurrentDatabaseName();
    if (!currentDbToClear) {
      this.showAlert({ title: "Error", message: "No database is currently active to clear.", closeButtonText: "OK" });
      return;
    }

    console.log(`Proceeding to clear all data in database: ${currentDbToClear}...`);
    try {
      await this.storageService.clearAll();
      this.showAlert({
        title: "Success",
        message: `All data in database '${currentDbToClear}' has been cleared.`,
        closeButtonText: "OK"
      });
      console.log(`Re-applying '${currentDbToClear}' as the default database setting after clearing.`);
      await this.setDefaultDbForAll(currentDbToClear);
      this.change.emit();
    } catch (error) {
      console.error(`Error clearing database '${currentDbToClear}':`, error);
      this.showAlert({ title: "Error", message: `Failed to clear database '${currentDbToClear}'.`, closeButtonText: "OK" });
    }
  }

  async removeSelectedDatabase() {
    const dbNameToDelete = this.currentDbName;
    if (!dbNameToDelete) {
        console.warn("No database selected for deletion.");
        this.showAlert({ title: "Warning", message: "No database selected to delete.", closeButtonText: "OK" });
        return;
    }

    console.log(`Proceeding with deletion of database: ${dbNameToDelete}`);
    try {
        await this.storageService.deleteDatabase(dbNameToDelete);
        console.log(`Database '${dbNameToDelete}' deleted successfully.`);
        
        await this.loadDatabaseState(); 
        
        if (this.initializedDbNames.length > 0 && this.currentDbName) {
            console.log(`Setting '${this.currentDbName}' as the new default database after deletion.`);
            await this.setDefaultDbForAll(this.currentDbName);
        } else if (this.initializedDbNames.length === 0) {
            console.log("All databases have been deleted. StorageService should fallback to default.");
        }
        
        this.showAlert({ title: "Success", message: `Database '${dbNameToDelete}' has been deleted.`, closeButtonText: "OK" });
        this.change.emit();

    } catch (error) {
        console.error(`Error deleting database '${dbNameToDelete}':`, error);
        this.showAlert({ title: "Error", message: `Failed to delete database '${dbNameToDelete}'.`, closeButtonText: "OK" });
        await this.loadDatabaseState();
    }
  }

  async backupDatabase(): Promise<void> {
    this.isBackingUp = true;
    try {
      const backupData: KeyValueItem[] = await this.storageService.backupDatabase();

      if (backupData.length === 0) {
        this.isBackingUp = false;
        this.showAlert({ title: "Info", message: "No data to backup from the current database.", closeButtonText: "OK" });
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
      this.showAlert({ title: "Success", message: "Database backup successful!", closeButtonText: "OK" });

    } catch (error) {
      console.error('Error during backup:', error);
      this.showAlert({ title: "Error", message: "Database backup failed.", closeButtonText: "OK" });
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
        await this.loadDatabaseState();
        await this.setDefaultDbForAll(this.currentDbName);
        this.change.emit();
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
      
      console.log(`Setting new database '${databaseName}' as default for all collections.`);
      await this.setDefaultDbForAll(databaseName);

      console.log(`Successfully created and switched to new database: ${this.currentDbName}`);
    } catch (error) {
      console.error(`Error creating or switching to database '${databaseName}':`, error);
      await this.loadDatabaseState(); 
    } finally {
      this.change.emit();
      this.isCreatingDb = false;
    }
  }

  public async setDefaultDbForAll(defaultDbValue: string): Promise<void> {
    const keyToSet = this.storageService.DEFAULT_DB_STORAGE_KEY;
    let originalDbName: string;

    try {
      originalDbName = this.storageService.getCurrentDatabaseName();
      console.log(`setDefaultDbForAll: Original/Current active database is: ${originalDbName}. Preferred default to set: ${defaultDbValue}`);
    } catch (error) {
      console.error("setDefaultDbForAll: Failed to get current database name:", error);
      this.showAlert({
        title: 'Error',
        message: 'Could not determine the current database to set defaults. Operation aborted.',
        closeButtonText: 'OK'
      });
      return;
    }

    const allDbNames = this.storageService.getInitializedDatabaseNames();
    console.log(`setDefaultDbForAll: Attempting to set '${keyToSet}=${defaultDbValue}' for all ${allDbNames.length} initialized databases: ${allDbNames.join(', ')}.`);

    for (const dbName of allDbNames) {
      try {
        if (dbName !== this.storageService.getCurrentDatabaseName()) {
          console.log(`setDefaultDbForAll: Switching to database '${dbName}' to set '${keyToSet}'...`);
          await this.storageService.switchDatabase(dbName);
        } else {
          console.log(`setDefaultDbForAll: Already on database '${dbName}'. Proceeding to set '${keyToSet}'.`);
        }
        await this.storageService.setItem(keyToSet, defaultDbValue);
        console.log(`setDefaultDbForAll: Successfully set '${keyToSet}=${defaultDbValue}' for database: ${dbName}`);
      } catch (error) {
        console.error(`setDefaultDbForAll: Failed to set '${keyToSet}' for database ${dbName}:`, error);
        this.showAlert({
          title: 'Error Setting Default',
          message: `Failed to set default preference in database ${dbName}.`,
          closeButtonText: 'OK'
        });
      }
    }

    try {
      if (defaultDbValue !== this.storageService.getCurrentDatabaseName()) {
        console.log(`setDefaultDbForAll: Ensuring target default database '${defaultDbValue}' is active...`);
        await this.storageService.switchDatabase(defaultDbValue);
      }
      this.currentDbName = this.storageService.getCurrentDatabaseName();
      console.log(`setDefaultDbForAll: Finished. Active database is now '${this.currentDbName}'.`);
    } catch (error) {
      console.error(`setDefaultDbForAll: CRITICAL - Failed to switch to target default database ${defaultDbValue}:`, error);
      await this.loadDatabaseState();
    }
  }
}
