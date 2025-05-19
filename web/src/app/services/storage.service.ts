// Angular Core
import { Injectable } from '@angular/core';
// Third-party Libraries
import Dexie, { Table, IndexableType } from 'dexie';


interface KeyValueItem {
  key: string;
  value: any;
}

export class AppDB extends Dexie {
  keyValueStore!: Table<KeyValueItem, string>;

  constructor(databaseName: string) {
    super(databaseName);
    this.version(1).stores({
      keyValueStore: 'key'
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly DEFAULT_NAME_DB = 'forgeIDEA';
  readonly DEFAULT_DB_STORAGE_KEY = 'defaultDB';

  private dbs: Map<string, AppDB> = new Map();
  private currentDb!: AppDB;
  private currentDbName: string;

  private readyPromise: Promise<void>;
  private resolveReady!: () => void;


  constructor() {
    this.readyPromise = new Promise(resolve => {
      this.resolveReady = resolve;
    });
    this.currentDbName = this.DEFAULT_NAME_DB;
    const defaultDbInstance = new AppDB(this.currentDbName);
    this.dbs.set(this.currentDbName, defaultDbInstance);
    this.currentDb = defaultDbInstance;

    // Asynchronously open the default DB and then proceed with other initializations
    // that might depend on DB state.
    const initializeAsync = async () => {
      try {
        await this.currentDb.open();
        console.log(`StorageService (Dexie-based) initialized. Default database: '${this.currentDbName}' opened.`);
        
        await this.loadExistingDatabaseNames();
        await this.applyDefaultDatabaseSetting();

      } catch (err: any) {
        console.error(`StorageService: Critical error during async initialization: ${err.stack || err}`);
      } finally {
        this.resolveReady();
        console.log(`StorageService: Async initialization finished. Ready state resolved.`);
      }
    };

    initializeAsync();
    console.log(`StorageService: Synchronous part of constructor finished. Async initialization started.`);
  }

  public async whenReady(): Promise<void> {
    return this.readyPromise;
  }

  public async createDatabase(dbName: string): Promise<void> {
    if (this.dbs.has(dbName)) {
      console.log(`StorageService: Database '${dbName}' already exists in the internal map.`);
      const existingDb = this.dbs.get(dbName)!;
      if (!existingDb.isOpen()) {
        console.log(`StorageService: Database '${dbName}' exists but is closed. Attempting to open...`);
        try {
          await existingDb.open();
          console.log(`StorageService: Existing database '${dbName}' opened successfully.`);
        } catch (err: any) {
          console.error(`StorageService: Error opening existing (but closed) database '${dbName}' during createDatabase call: ${err.stack || err}`);
          throw err; 
        }
      } else {
        console.log(`StorageService: Existing database '${dbName}' is already open.`);
      }
      return;
    }

    console.log(`StorageService: Database '${dbName}' not in map. Proceeding with creation/opening logic...`);
    const newDbInstance = new AppDB(dbName);
    try {
      await newDbInstance.open();
      this.dbs.set(dbName, newDbInstance);
      console.log(`StorageService: Database '${dbName}' is now initialized (created or opened) and added to the map.`);
    } catch (err: any) {
      console.error(`StorageService: Error initializing (creating/opening) database '${dbName}': ${err.stack || err}`);
      throw err;
    }
  }

  public async switchDatabase(dbName: string): Promise<void> {
    if (dbName === this.currentDbName) {
      console.log(`StorageService: Already using database '${dbName}'.`);
      return;
    }

    let dbInstance = this.dbs.get(dbName);

    if (dbInstance) {
      this.currentDb = dbInstance;
      this.currentDbName = dbName;
      if (!this.currentDb.isOpen()) {
        console.log(`StorageService: Switched to existing database '${dbName}'. Opening it...`);
        try {
          await this.currentDb.open();
          console.log(`StorageService: Database '${dbName}' opened successfully.`);
        } catch (err: any) {
          console.error(`StorageService: Error opening existing database '${dbName}': ${err.stack || err}`);
          throw err;
        }
      } else {
        console.log(`StorageService: Switched to existing, already open database '${dbName}'.`);
      }
    } else {
      console.log(`StorageService: Database '${dbName}' not found locally. Creating, opening, and switching...`);
      dbInstance = new AppDB(dbName);
      try {
        await dbInstance.open();
        this.dbs.set(dbName, dbInstance);
        this.currentDb = dbInstance;
        this.currentDbName = dbName;
        console.log(`StorageService: Created, opened, and switched to new database '${dbName}'.`);
      } catch (err: any) {
        console.error(`StorageService: Error creating and opening new database '${dbName}': ${err.stack || err}`);
        throw err;
      }
    }
  }

  public getCurrentDatabaseName(): string {
    return this.currentDbName;
  }

  public getInitializedDatabaseNames(): string[] {
    return Array.from(this.dbs.keys());
  }

  async setItem<T = any>(key: string, value: T): Promise<string> {
    if (key === undefined || key === null) {
      return Promise.reject(new Error('Key cannot be undefined or null.'));
    }
    console.log(`StorageService (${this.currentDbName}): Saving/Updating key: ${key}`);
    return this.currentDb.keyValueStore.put({ key: key, value: value });
  }

  async getItem<T = any>(key: string): Promise<T | undefined> {
    console.log(`StorageService (${this.currentDbName}): Retrieving key: ${key}`);
    const item = await this.currentDb.keyValueStore.get(key);
    return item?.value as T | undefined;
  }

  async removeItem(key: string): Promise<void> {
    console.log(`StorageService (${this.currentDbName}): Removing key: ${key}`);
    return this.currentDb.keyValueStore.delete(key);
  }

  async clearAll(): Promise<void> {
    console.warn(`StorageService (${this.currentDbName}): DELETING ALL DATA in keyValueStore of database '${this.currentDbName}'!`);
    return this.currentDb.keyValueStore.clear();
  }

  async getAllKeys(): Promise<string[]> {
    console.log(`StorageService (${this.currentDbName}): Retrieving all keys from database '${this.currentDbName}'`);
    const keys: IndexableType[] = await this.currentDb.keyValueStore.toCollection().keys();
    return keys as string[];
  }

  async getAllValues<T = any>(): Promise<T[]> {
    console.log(`StorageService (${this.currentDbName}): Retrieving all values from database '${this.currentDbName}'`);
    const items = await this.currentDb.keyValueStore.toArray();
    return items.map(item => item.value as T);
  }

  async backupDatabase(): Promise<KeyValueItem[]> {
    console.log(`StorageService (${this.currentDbName}): Starting database backup for '${this.currentDbName}'...`);
    try {
      const allItems = await this.currentDb.keyValueStore.toArray();
      console.log(`StorageService (${this.currentDbName}): Backup completed. Exported ${allItems.length} items from '${this.currentDbName}'.`);
      return allItems;
    } catch (error) {
      console.error(`StorageService (${this.currentDbName}): Error during database backup for '${this.currentDbName}':`, error);
      throw error; // Re-throw the error for external handling.
    }
  }

  async restoreDatabase(backupData: KeyValueItem[]): Promise<void> {
    console.warn(`StorageService (${this.currentDbName}): Starting restore of keyValueStore for database '${this.currentDbName}'. ALL CURRENT DATA IN THIS STORE WILL BE DELETED!`);

    if (!Array.isArray(backupData)) {
      const errorMsg = `StorageService (${this.currentDbName}): Restore error. Backup data is not a valid array.`;
      console.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    try {
      await this.currentDb.transaction('rw', this.currentDb.keyValueStore, async () => {
        console.log(`StorageService (${this.currentDbName}): Deleting existing data in '${this.currentDbName}'...`);
        await this.currentDb.keyValueStore.clear();
        console.log(`StorageService (${this.currentDbName}): Existing data in '${this.currentDbName}' deleted.`);

        if (backupData.length > 0) {
          console.log(`StorageService (${this.currentDbName}): Inserting ${backupData.length} items from backup into '${this.currentDbName}'...`);
          await this.currentDb.keyValueStore.bulkPut(backupData);
          console.log(`StorageService (${this.currentDbName}): Items from backup inserted into '${this.currentDbName}'.`);
        } else {
          console.log(`StorageService (${this.currentDbName}): No items to insert from backup (empty array) into '${this.currentDbName}'.`);
        }
      });
      console.log(`StorageService (${this.currentDbName}): Store restore for '${this.currentDbName}' completed successfully.`);
    } catch (error) {
      console.error(`StorageService (${this.currentDbName}): Error during restore transaction for '${this.currentDbName}':`, error);
      throw error;
    }
  }

  private async loadExistingDatabaseNames(): Promise<void> {
    try {
      const dbNames = await Dexie.getDatabaseNames();
      console.log(`StorageService: Found existing Dexie databases on this origin: ${dbNames.join(', ')}`);
      for (const name of dbNames) {
        if (!this.dbs.has(name)) {
          console.log(`StorageService: Initializing reference for existing database '${name}' found on disk.`);
          const dbInstance = new AppDB(name);
          this.dbs.set(name, dbInstance);
        }
      }
    } catch (error) {
      console.error('StorageService: Error fetching existing database names from Dexie:', error);
    }
  }

  public async deleteDatabase(dbName: string): Promise<void> {
    if (!dbName) {
      const errMsg = 'StorageService: Database name not provided for deletion.';
      console.error(errMsg);
      throw new Error(errMsg);
    }

    console.log(`StorageService: Attempting to delete database '${dbName}'...`);

    const dbInstance = this.dbs.get(dbName);
    if (dbInstance && dbInstance.isOpen()) {
      console.log(`StorageService: Closing database '${dbName}' before deletion.`);
      dbInstance.close();
    }

    try {
      await Dexie.delete(dbName);
      console.log(`StorageService: Database '${dbName}' deleted successfully from disk.`);
    } catch (error: any) {
      console.error(`StorageService: Error deleting database '${dbName}' from disk: ${error.stack || error}`);
      throw error;
    }

    this.dbs.delete(dbName);
    console.log(`StorageService: Database '${dbName}' removed from internal management map.`);

    if (this.currentDbName === dbName) {
      console.warn(`StorageService: The current database '${dbName}' was deleted. Switching to a fallback.`);

      let fallbackDbName: string;

      if (this.dbs.size > 0) {
        fallbackDbName = this.dbs.keys().next().value as string;
        console.log(`StorageService: Found other databases in map. Switching to the first available: '${fallbackDbName}'.`);
      } else {
        fallbackDbName = this.DEFAULT_NAME_DB;
        console.log(`StorageService: No other databases in map. Attempting to switch to/create default database '${fallbackDbName}'.`);
      }

      try {
        await this.switchDatabase(fallbackDbName);
        console.log(`StorageService: Successfully switched to fallback database '${this.currentDbName}'.`);
      } catch (switchError: any) {
        console.error(`StorageService: CRITICAL - Failed to switch to fallback database '${fallbackDbName}' after deleting '${dbName}': ${switchError.stack || switchError}`);
      }
    }
    await this.loadExistingDatabaseNames();
    console.log(`StorageService: Database list refreshed after deletion of '${dbName}'. Current databases in map: ${Array.from(this.dbs.keys()).join(', ')}`);
  }

  public async applyDefaultDatabaseSetting(): Promise<void> {
    console.log(`StorageService: Checking for '${this.DEFAULT_DB_STORAGE_KEY}' setting in current DB '${this.currentDbName}' to apply as default.`);

    let preferredDbName: string | undefined;
    try {
      // Ensure the current DB is open before trying to read from it.
      // Dexie's getItem should handle opening if not already open, but an explicit check can be safer during init.
      if (!this.currentDb.isOpen()) {
          console.log(`StorageService: Current DB '${this.currentDbName}' is not open. Attempting to open before reading '${this.DEFAULT_DB_STORAGE_KEY}'.`);
          await this.currentDb.open();
          console.log(`StorageService: Current DB '${this.currentDbName}' opened successfully.`);
      }
      preferredDbName = await this.getItem<string>(this.DEFAULT_DB_STORAGE_KEY);
    } catch (error) {
      console.error(`StorageService: Error reading '${this.DEFAULT_DB_STORAGE_KEY}' from '${this.currentDbName}': ${error instanceof Error ? error.stack : error}. Will not switch based on this setting.`);
      return; 
    }

    if (preferredDbName && typeof preferredDbName === 'string') {
      if (preferredDbName === this.currentDbName) {
        console.log(`StorageService: Preferred default database '${preferredDbName}' (from '${this.DEFAULT_DB_STORAGE_KEY}') is already the current database. No switch needed.`);
        return;
      }

      console.log(`StorageService: Found preferred default database '${preferredDbName}' from '${this.DEFAULT_DB_STORAGE_KEY}' setting. Attempting to switch...`);
      try {
        await this.switchDatabase(preferredDbName);
        console.log(`StorageService: Successfully switched to preferred default database '${this.currentDbName}' based on '${this.DEFAULT_DB_STORAGE_KEY}' setting.`);
      } catch (switchError) {
        console.error(`StorageService: Failed to switch to preferred default database '${preferredDbName}' (from '${this.DEFAULT_DB_STORAGE_KEY}'): ${switchError instanceof Error ? switchError.stack : switchError}.`);
      }
    } else if (preferredDbName === undefined) {
      console.log(`StorageService: No '${this.DEFAULT_DB_STORAGE_KEY}' setting found in '${this.currentDbName}'. No automatic switch will occur based on this setting.`);
    } else {
      console.warn(`StorageService: Invalid value for '${this.DEFAULT_DB_STORAGE_KEY}' setting in '${this.currentDbName}':`, preferredDbName, `. Expected a string. No automatic switch will occur.`);
    }
  }
}