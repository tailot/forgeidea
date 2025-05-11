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

import { OnlineStatusService } from '../services/onlinestatus.service';
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
  ifIsOnline: boolean = false;
  isLoading = true;
  errorMessage: string | null = null;

  totalIdeas = 0;
  pageSize = 10;
  currentPage = 0;

  searchTerm: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  

  constructor(
    private onlineStatusService: OnlineStatusService,
    private storageService: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadValidIdeas();
    this.onlineStatusService.isOnline$.subscribe((isOnline) => {
      this.ifIsOnline = isOnline;
    });
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
      console.log(`Found ${validUuidKeys.length} valid UUID keys out of ${allKeys.length} total.`);

      const ideaPromises = validUuidKeys.map(async (uuid) => {
        try {
          const retrievedData = await this.storageService.getItem<Idea>(uuid);
          if (retrievedData) {
            return retrievedData;
          } else {
            console.warn(`No data found for valid UUID: ${uuid}`);
            return null;
          }
        } catch (itemError) {
          console.error(`Error retrieving or processing item for UUID ${uuid}:`, itemError);
          return null;
        }
      });

      const resolvedIdeas = await Promise.all(ideaPromises);
      this.allIdeas = resolvedIdeas.filter((idea): idea is Idea => idea !== null);
      this.applyFilterAndPaginate();

    } catch (error) {
      console.error('Error loading keys or ideas:', error);
      this.errorMessage = `Unable to load the list of ideas. ${error instanceof Error ? error.message : ''}`;
      this.allIdeas = [];
      this.filteredIdeas = [];
      this.totalIdeas = 0;
    } finally {
      this.isLoading = false;
    }
  }

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
    if (!this.ifIsOnline) {
      console.warn('Navigation offline.');
      return;
    }
    if (!ideaId) {
      console.warn('Navigation without ID.');
      return;
    }
    this.router.navigate(['/jobcard', ideaId]);
  }
}