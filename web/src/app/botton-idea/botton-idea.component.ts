// Angular Core and Router
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

// Application-specific Services and Models
import { GenkitService, Idea } from '../services/genkit.service';
import { LanguageService } from '../services/language.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-botton-idea',
  imports: [
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './botton-idea.component.html',
  styleUrl: './botton-idea.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottonIdeaComponent {
  constructor(
    private genkitService: GenkitService,
    private storageService: StorageService,
    private languageService: LanguageService,
    private router: Router
  ) { }
  isLoading = false;
  generatedIdea: Idea | null = null;
  errorMessage: string | null = null;

  onButtonClick() {
    console.log('Attempting to generate random idea...');
    this.isLoading = true;
    this.generatedIdea = null;
    this.errorMessage = null;

    const language = this.languageService.getCurrentLanguageBackendName();

    this.genkitService.callRandomIdea({ language }, true).subscribe({
      next: (idea: Idea) => {
        console.log('Idea generated successfully:', idea);
        const uuid = crypto.randomUUID()
        this.generatedIdea = idea;
        this.storageService.setItem(uuid, this.generatedIdea)
        this.isLoading = false;
        this.router.navigate(['/jobcard', uuid]);
      },
      error: (error) => {
        console.error('Error during idea generation:', error);
        this.errorMessage = error.message || 'An unknown error occurred.';
        this.isLoading = false;
      }
    });
  }
}
