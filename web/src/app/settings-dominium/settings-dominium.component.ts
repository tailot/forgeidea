// Angular Core, Common, and Forms
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// RxJS
import { EMPTY, Subscription, from } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

// Application-specific Services and Models
import { EncryptedPayloadData, GenkitService, GetPromptRequestData } from '../services/genkit.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-settings-dominium',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatDividerModule
  ],
  templateUrl: './settings-dominium.component.html',
  styleUrl: './settings-dominium.component.sass'
})
/**
 * Component for managing "Dominium" generator settings.
 * It allows users to input a Dominium identifier, which is then used to fetch
 * specific prompt configurations (e.g., '_idea', '_categories') from a Genkit service.
 * These configurations and the Dominium identifier itself are stored using StorageService.
 * The component also handles loading existing settings and clearing them.
 */
export class SettingsDominiumComponent implements OnInit, OnDestroy {
  /**
   * Emits `true` when a Dominium value is successfully set and its associated
   * prompt configurations are fetched and stored. Emits `false` if the Dominium
   * value is cleared or if loading/setting fails.
   */
  @Output() dominiumOn = new EventEmitter<boolean>();

  /** Flag indicating whether the process of setting the Dominium and fetching its data is currently active. */
  isSettingDominium = false;
  /** The Dominium identifier string input by the user or loaded from storage. */
  dominiumValue: string | undefined;

  /** @private Subscription for the `setDominium` operation. */
  private setDominiumSubscription: Subscription | undefined;
  /** @private Subscription for loading the Dominium value on init. */
  private loadDominiumSubscription: Subscription | undefined;

  /**
   * Constructs the SettingsDominiumComponent.
   * @param genkitService Service for interacting with the Genkit API to fetch prompt data.
   * @param storageService Service for storing and retrieving settings, including the Dominium identifier and fetched prompts.
   */
  constructor(
    private genkitService: GenkitService,
    private storageService: StorageService
  ) { }

  /**
   * Initializes the component.
   * Attempts to load an existing 'generator' (Dominium identifier) value from storage.
   * If found, it updates `dominiumValue` and emits the status through `dominiumOn`.
   */
  ngOnInit(): void {
    this.loadDominiumSubscription = from(this.storageService.getItem<string>('generator')).pipe(
      tap(value => {
        this.dominiumValue = value;
        if (value) {
          this.dominiumOn.emit(true);
        }else{
          this.dominiumOn.emit(false);
        }
        console.log('Dominium value loaded from storage:', this.dominiumValue);
      }),
      catchError(error => {
        console.error('Error loading dominium value from storage:', error);
        this.dominiumValue = '';
        return EMPTY;
      })
    ).subscribe();
  }

  /**
   * Sets the Dominium generator and fetches associated prompt configurations.
   * If `dominiumValue` is set, this method:
   * 1. Calls `genkitService.callGetPrompt` to get encrypted payloads for '_idea' and '_categories' prompts.
   * 2. Stores these payloads in `StorageService`.
   * 3. Stores the `dominiumValue` itself as 'generator' in `StorageService`.
   * 4. Emits `dominiumOn(true)` upon successful completion of all steps.
   * Handles errors by resetting to default values and emits `dominiumOn(false)`.
   * Updates `isSettingDominium` to reflect the operation's status.
   */
  setDominium(): void {
    console.log("ddd")
    this.isSettingDominium = true;
    if (!this.dominiumValue || this.dominiumValue.trim() === '') {
      console.warn('Dominium value is empty. Cannot set dominium.');
      this.isSettingDominium = false;
      return;
    }
    console.log('setDominium called with value:', this.dominiumValue);

    const requestDataIdea: GetPromptRequestData = {
      generator: this.dominiumValue,
      promptname: '_idea'
    };

    if (this.setDominiumSubscription) {
      this.setDominiumSubscription.unsubscribe();
    }

    this.setDominiumSubscription = this.genkitService.callGetPrompt(requestDataIdea).pipe(
      switchMap((responseIdea: EncryptedPayloadData) => {
        console.log('Received encrypted payload from getPrompt for _idea:', responseIdea);
        return from(this.storageService.setItem('_idea', responseIdea)).pipe(
          tap(() => console.log('Successfully saved _idea to storage.'))
        );
      }),
      switchMap(() => {
        console.log('Proceeding to fetch _category after _idea operations.');
        const requestDataCategory: GetPromptRequestData = {
          generator: this.dominiumValue || '',
          promptname: '_categories'
        };
        return this.genkitService.callGetPrompt(requestDataCategory);
      }),
      switchMap((responseCategory: EncryptedPayloadData) => {
        console.log('Received encrypted payload from getPrompt for _category:', responseCategory);
        return from(this.storageService.setItem('_categories', responseCategory)).pipe(
          tap(() => console.log('Successfully saved _categories to storage.'))
        );
      }),
      catchError(error => {
        this.setDefaultValue()
        console.error('Error during setDominium operations chain (_idea or _category):', error);
        return EMPTY;
      }),
      finalize(() => {
        this.isSettingDominium = false;
        console.log('setDominium operations finalized. isSettingDominium set to false.');
      })
    ).subscribe({
      next: () => {
        this.dominiumOn.emit(true);
        this.storageService.setItem('generator', this.dominiumValue);
        console.log('All dominium settings (_idea and _categories) processed and saved successfully.');
      },
      error: (err) => {
        console.error('Unhandled error in setDominium subscription:', err);
      },
      complete: () => {
        console.log('setDominium subscription stream completed.');
      }
    });
  }

  /**
   * Removes Dominium-related data ('_idea', '_categories', 'generator')
   * from the StorageService.
   */
  cleanStorage(): void {
    this.storageService.removeItem('_idea');
    this.storageService.removeItem('_categories');
    this.storageService.removeItem('generator');
    console.log('Dominium-related items removed from storage.');
  }

  /**
   * Resets the Dominium configuration.
   * Clears the `dominiumValue` input field, removes related items from storage
   * via `cleanStorage()`, and emits `dominiumOn(false)`.
   */
  setDefaultValue() {
    this.dominiumValue = '';
    this.cleanStorage()
    this.dominiumOn.emit(false);
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   * Unsubscribes from `setDominiumSubscription` and `loadDominiumSubscription`
   * to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.setDominiumSubscription) {
      this.setDominiumSubscription.unsubscribe();
      console.log('Unsubscribed from setDominiumSubscription.');
    }
    if (this.loadDominiumSubscription) {
      this.loadDominiumSubscription.unsubscribe();
      console.log('Unsubscribed from loadDominiumSubscription.');
    }
  }
}
