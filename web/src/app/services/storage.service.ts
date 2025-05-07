import { Injectable } from '@angular/core';
import Dexie, { Table, IndexableType } from 'dexie';

interface KeyValueItem {
  key: string;
  value: any;
}

export class AppDB extends Dexie {
  keyValueStore!: Table<KeyValueItem, string>;

  constructor() {
    super('IDEAforge');
    this.version(1).stores({
      keyValueStore: 'key'
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private db: AppDB;

  constructor() {
    this.db = new AppDB();
    this.db.open().catch(err => {
      console.error(`Error opening Dexie database 'IDEAforge': ${err.stack || err}`);
    });
    console.log("StorageService (Dexie-based) initialized.");
  }

  async setItem<T = any>(key: string, value: T): Promise<string> {
    if (key === undefined || key === null) {
      return Promise.reject(new Error('Key cannot be undefined or null.'));
    }
    console.log(`DexieStorage: Saving/Updating key: ${key}`);
    return this.db.keyValueStore.put({ key: key, value: value });
  }

  async getItem<T = any>(key: string): Promise<T | undefined> {
    console.log(`DexieStorage: Retrieving key: ${key}`);
    const item = await this.db.keyValueStore.get(key);
    return item?.value as T | undefined;
  }

  async removeItem(key: string): Promise<void> {
    console.log(`DexieStorage: Removing key: ${key}`);
    return this.db.keyValueStore.delete(key);
  }

  async clearAll(): Promise<void> {
    console.warn('DexieStorage: DELETING ALL DATA in keyValueStore!');
    return this.db.keyValueStore.clear();
  }

  async getAllKeys(): Promise<string[]> {
    console.log('DexieStorage: Retrieving all keys');
    const keys: IndexableType[] = await this.db.keyValueStore.toCollection().keys();
    return keys as string[];
  }

  async getAllValues<T = any>(): Promise<T[]> {
    console.log('DexieStorage: Retrieving all values');
    const items = await this.db.keyValueStore.toArray();
    return items.map(item => item.value as T);
  }

  async backupDatabase(): Promise<KeyValueItem[]> {
    console.log('DexieStorage: Starting database backup...');
    try {
      const allItems = await this.db.keyValueStore.toArray();
      console.log(`DexieStorage: Backup completed. Exported ${allItems.length} items.`);
      return allItems;
    } catch (error) {
      console.error('DexieStorage: Error during database backup:', error);
      throw error; // Re-throw the error for external handling.
    }
  }

  async restoreDatabase(backupData: KeyValueItem[]): Promise<void> {
    console.warn('DexieStorage: Starting restore of keyValueStore. ALL CURRENT DATA WILL BE DELETED!');

    if (!Array.isArray(backupData)) {
      const errorMsg = 'DexieStorage: Restore error. Backup data is not a valid array.';
      console.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    try {
      await this.db.transaction('rw', this.db.keyValueStore, async () => {
        console.log('DexieStorage: Deleting existing data...');
        await this.db.keyValueStore.clear();
        console.log('DexieStorage: Existing data deleted.');

        if (backupData.length > 0) {
          console.log(`DexieStorage: Inserting ${backupData.length} items from backup...`);
          await this.db.keyValueStore.bulkPut(backupData);
          console.log('DexieStorage: Items from backup inserted.');
        } else {
          console.log('DexieStorage: No items to insert from backup (empty array).');
        }
      });
      console.log('DexieStorage: Store restore completed successfully.');
    } catch (error) {
      console.error('DexieStorage: Error during restore transaction:', error);
      throw error;
    }
  }
}