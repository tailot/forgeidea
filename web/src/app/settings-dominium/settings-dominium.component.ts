import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription, EMPTY, from } from 'rxjs';
import { catchError, tap, switchMap, finalize } from 'rxjs/operators';

import { GenkitService, GetPromptRequestData, EncryptedPayloadData } from '../services/genkit.service';
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
export class SettingsDominiumComponent implements OnInit, OnDestroy {
  errorGenerator = false;
  isSettingDominium = false
  dominiumValue: string = '';
  private setDominiumSubscription: Subscription | undefined;
  private loadDominiumSubscription: Subscription | undefined;

  constructor(
    private genkitService: GenkitService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.loadDominiumSubscription = from(this.storageService.getItem<string>('generator')).pipe(
      tap(value => {
        this.dominiumValue = value || '';
        console.log('Dominium value loaded from storage:', this.dominiumValue);
      }),
      catchError(error => {
        console.error('Error loading dominium value from storage:', error);
        this.dominiumValue = '';
        return EMPTY;
      })
    ).subscribe();
  }

  setDominium(): void {
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
          generator: this.dominiumValue,
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
        this.cleanStorage();

        this.errorGenerator = true;
        console.error('Error during setDominium operations chain (_idea or _category):', error);
        return EMPTY;
      }),
      finalize(() => {
        this.isSettingDominium = false;
        console.log('setDominium operations finalized. isSettingDominium set to false.');
      })
    ).subscribe({
      next: () => {
        this.storageService.setItem('generator', this.dominiumValue);
        console.log('All dominium settings (_idea and _categories) processed and saved successfully.');
      },
      error: (err) => {
        console.error('Unhandled error in setDominium subscription:', err);
      },
      complete: () => {
        this.errorGenerator = false;
        console.log('setDominium subscription stream completed.');
      }
    });
  }

  cleanStorage(): void {
    this.storageService.removeItem('_idea');
    this.storageService.removeItem('_categories');
    this.storageService.removeItem('generator');
    console.log('Dominium-related items removed from storage.');
  }
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
