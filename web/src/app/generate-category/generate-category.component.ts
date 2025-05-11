import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Observable, of, firstValueFrom } from 'rxjs';

import { catchError } from 'rxjs/operators';

import { GenkitService, Idea } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-generate-category',
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule, // Aggiunto per mat-form-field
    MatInputModule,     // Aggiunto per matInput
    MatButtonModule     // Aggiunto per mat-button e mat-icon-button
  ],
  templateUrl: './generate-category.component.html',
  styleUrl: './generate-category.component.sass'
})
export class GenerateCategoryComponent implements OnInit {

  private genkitService = inject(GenkitService);
  private languageService = inject(LanguageService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  categories$: Observable<string[]> = of([]);
  errorMessage: string | null = null;
  selectedCategory: string | null = null;
  isGenerating: boolean = false;
  scoreThreshold: number = 0;
  searchTerm: string = '';


  async ngOnInit(): Promise<void> {
    this.loadCategories();
    try {
      const storedScore = await this.storageService.getItem<number>('score');
      if (storedScore !== null && typeof storedScore === 'number') {
        this.scoreThreshold = storedScore;
        console.log(`GenerateCategoryComponent: Valore 'score' caricato: ${this.scoreThreshold}`);
      } else {
        console.log(`GenerateCategoryComponent: Nessun valore 'score' trovato o non valido, usando default: ${this.scoreThreshold}`);
      }
    } catch (error) {
      console.error("GenerateCategoryComponent: Errore nel caricamento dell'impostazione 'score':", error);
    }
  }

  loadCategories(context = ""): void {
    this.errorMessage = null; // Reset error message
    this.isGenerating = false;
    const currentLanguageCode = this.languageService.getCurrentLanguageCode();
    const currentLanguageBackendName = this.languageService.getCurrentLanguageBackendName();

    console.log(`GenerateCategoryComponent: Loading categories for language code: ${currentLanguageCode} (Backend: ${currentLanguageBackendName})`);

    this.categories$ = this.genkitService.callGenerateIdeaCategories({context: context, count: 35, language: currentLanguageBackendName })
      .pipe(
        catchError(error => {
          console.error('Error loading categories:', error);
          this.errorMessage = error instanceof Error ? error.message : 'Failed to load categories. Please try again later.';
          return of([]);
        })
      );
  }

  /**
   * Handles the selection of a category chip.
   * Triggers idea generation, saving, and navigation.
   * @param selected The value emitted by the chip listbox, expected to be the category string.
   */
  async onCategorySelectionChange(selected: string | string[] | undefined): Promise<void> {
    if (typeof selected !== 'string' || !selected || this.isGenerating) {
      if (this.isGenerating) {
        console.warn('Generation already in progress.');
      } else {
        console.log('Category selection cleared or invalid.');
        this.selectedCategory = null;
      }
      return;
    }

    this.selectedCategory = selected;
    this.errorMessage = null;
    this.isGenerating = true;
    console.log('Selected category:', this.selectedCategory);

    const currentLanguageBackendName = this.languageService.getCurrentLanguageBackendName();

    try {
      let ideaText: string;
      let generatedIdeaCategory = this.selectedCategory;

      if (this.scoreThreshold > 0) {
        console.log(`GenerateCategoryComponent: scoreThreshold is ${this.scoreThreshold}, calling callRequirementScore.`);
        const requirementScoreRequestData = {
          category: this.selectedCategory,
          maxscore: this.scoreThreshold,
          language: currentLanguageBackendName
        };
        console.log(`Generating idea using requirement score for category: ${requirementScoreRequestData.category}, language: ${requirementScoreRequestData.language}, maxscore: ${requirementScoreRequestData.maxscore}`);

        ideaText = await firstValueFrom(
          this.genkitService.callRequirementScore(requirementScoreRequestData, true) // bypassCache = true
        );
        if (!ideaText) {
          throw new Error('Received invalid idea text from callRequirementScore service.');
        }
      } else {
        console.log(`GenerateCategoryComponent: scoreThreshold is ${this.scoreThreshold}, calling callGenerateIdea.`);
        const generateIdeaRequestData = {
          category: this.selectedCategory,
          language: currentLanguageBackendName
        };
        console.log(`Generating idea for category: ${generateIdeaRequestData.category}, language: ${generateIdeaRequestData.language}`);

        const generatedIdeaResult = await firstValueFrom(
          this.genkitService.callGenerateIdea(generateIdeaRequestData, true) // bypassCache = true
        );
        console.log(generatedIdeaResult.text)
        if (!generatedIdeaResult || !generatedIdeaResult.text) {
          throw new Error('Received invalid idea data from callGenerateIdea service.');
        }
        ideaText = generatedIdeaResult.text;
        // If callGenerateIdea returns a category, prefer that, otherwise stick to selected.
        generatedIdeaCategory = generatedIdeaResult.category || this.selectedCategory;
      }

      const ideaUuid = crypto.randomUUID();

      const ideaToStore: Idea & { id: string, category: string, language?: string } = {
        text: ideaText,
        id: ideaUuid,
        category: generatedIdeaCategory,
        language: currentLanguageBackendName
      };

      console.log(`Generated idea: "${ideaToStore.text}", UUID: ${ideaToStore.id}`);

      await this.storageService.setItem<Idea & { id: string }>(ideaToStore.id, ideaToStore);
      console.log(`Idea with UUID ${ideaToStore.id} saved to storage.`);
      await this.router.navigate(['/jobcard', ideaToStore.id]);
      console.log(`Navigated to /jobcard/${ideaToStore.id}`);

    } catch (error) {
      console.error('Error during idea generation, saving, or navigation:', error);
      this.errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while processing the idea.';
    } finally {
      this.isGenerating = false;
    }
  }
}