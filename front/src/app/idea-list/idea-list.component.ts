import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

import { StorageService } from '../services/storage.service';
import { Idea } from '../services/genkit.service';
import { CardIdeaComponent } from '../card-idea/card-idea.component';

@Component({
  selector: 'app-idea-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatRippleModule,
    CardIdeaComponent,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './idea-list.component.html',
  styleUrls: ['./idea-list.component.sass']
})
export class IdeaListComponent implements OnInit {

  allIdeas: Idea[] = [];
  filteredIdeas: Idea[] = [];
  displayedIdeas: Idea[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  totalIdeas = 0;
  pageSize = 10;
  currentPage = 0;

  searchTerm: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  constructor(
    private storageService: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadValidIdeas();
  }

  private isValidUuid(key: string): boolean {
    return this.uuidRegex.test(key);
  }

  async loadValidIdeas(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.allIdeas = [];

    try {
      const allKeys = await this.storageService.getAllKeys();
      const validUuidKeys = allKeys.filter(key => this.isValidUuid(key));
      console.log(`Trovate ${validUuidKeys.length} chiavi UUID valide su ${allKeys.length} totali.`);

      const ideaPromises = validUuidKeys.map(async (uuid) => {
        try {
          const retrievedData = await this.storageService.getItem<any>(uuid);

          if (retrievedData) {
            if (!!retrievedData) {
              delete retrievedData.language
              delete retrievedData.category
              delete retrievedData.id
            }

            const idea: Idea = {
              id: uuid,
              text: Object.values(retrievedData).join('')
            };
            return idea;
          } else {
            console.warn(`Nessun dato trovato per UUID valido: ${uuid}`);
            return null;
          }
        } catch (itemError) {
          console.error(`Errore nel recuperare o processare l'item per UUID ${uuid}:`, itemError);
          return null; // Ignora questo item in caso di errore
        }
      });

      const resolvedIdeas = await Promise.all(ideaPromises);
      this.allIdeas = resolvedIdeas.filter((idea): idea is Idea => idea !== null);
      this.applyFilterAndPaginate();

    } catch (error) {
      console.error('Errore durante il caricamento delle chiavi o delle idee:', error);
      this.errorMessage = `Impossibile caricare l'elenco delle idee. ${error instanceof Error ? error.message : ''}`;
      this.allIdeas = [];
      this.filteredIdeas = [];
      this.totalIdeas = 0;
    } finally {
      this.isLoading = false;
    }
  }

  /** Filtra le idee basate su searchTerm e aggiorna la paginazione */
  applyFilterAndPaginate(): void {
    const filterValue = this.searchTerm.trim().toLowerCase();

    if (!filterValue) {
      this.filteredIdeas = [...this.allIdeas];
    } else {
      this.filteredIdeas = this.allIdeas.filter(idea =>
        idea.text.toLowerCase().includes(filterValue)
      );
    }

    this.totalIdeas = this.filteredIdeas.length;
    this.currentPage = 0;

    if (this.paginator) {
      this.paginator.firstPage();
    }

    this.updateDisplayedIdeas();
  }

  onSearchChange(): void {
    this.applyFilterAndPaginate();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilterAndPaginate();
  }

  updateDisplayedIdeas(): void {
    if (!this.filteredIdeas) return;
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedIdeas = this.filteredIdeas.slice(startIndex, endIndex);
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedIdeas();
  }

  viewIdeaDetails(ideaId: string | number | undefined): void {
    if (!ideaId) {
      console.warn('Tentativo di navigare senza un ID idea valido.');
      return;
    }
    this.router.navigate(['/jobcard', ideaId]);
  }
}