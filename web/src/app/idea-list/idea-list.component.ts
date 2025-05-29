/**
 * @fileoverview Defines the `IdeaListComponent` for the Angular web application.
 *
 * This component is responsible for displaying a list of "ideas" that are
 * retrieved from local storage. It provides functionalities such as:
 *  - Loading all valid ideas (identified by UUID keys) from storage.
 *  - Filtering the displayed ideas based on a user's search term.
 *  - Paginating the list of ideas for better user experience with large datasets.
 *  - Allowing users to navigate to a detailed view of a specific idea.
 *  - Handling the deletion of ideas and updating the list accordingly.
 *  - Displaying loading states and error messages during data operations.
 *  - Subscribing to online status updates to potentially alter behavior or UI.
 *
 * It uses Angular Material components for UI elements like pagination, cards,
 * buttons, and form fields.
 */
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
import { inject, DestroyRef, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { OnlineStatusService } from '../services/onlinestatus.service';
import { StorageService } from '../services/storage.service';
import { Idea } from '../services/genkit.service';
import { CardIdeaComponent } from '../card-idea/card-idea.component';

/**
 * A standalone component that displays a list of ideas with features like
 * pagination, search filtering, and deletion.
 *
 * It retrieves ideas from local storage, assuming each idea is stored under a UUID key.
 * The component manages the state for the full list of ideas, the filtered list,
 * and the currently displayed page of ideas. It also interacts with `OnlineStatusService`
 * and `StorageService`.
 *
 * @Component Decorator Details:
 *  - `selector`: 'app-idea-list' - The HTML tag used to embed this component.
 *  - `standalone`: true - Indicates that this is a standalone component.
 *  - `imports`: An array of modules and components required by this component's template:
 *    - `CommonModule`: Provides common Angular directives.
 *    - `RouterModule`: For router-related directives like `routerLink`.
 *    - `MatPaginatorModule`: For Angular Material paginator.
 *    - `MatProgressSpinnerModule`: For displaying a loading spinner.
 *    - `MatCardModule`: For styling idea cards.
 *    - `MatButtonModule`: For Material Design styled buttons.
 *    - `MatRippleModule`: For Material Design ripple effects.
 *    - `CardIdeaComponent`: The child component used to display individual ideas.
 *    - `MatFormFieldModule`: For styling form fields (e.g., search input).
 *    - `MatInputModule`: For text input fields.
 *    - `MatIconModule`: For using Material icons.
 *    - `FormsModule`: For two-way data binding with form inputs like the search term.
 *  - `templateUrl`: './idea-list.component.html' - Path to the component's HTML template.
 *  - `styleUrls`: ['./idea-list.component.sass'] - Path to the component's Sass stylesheet(s).
 *
 * Implements:
 *  - `OnInit`: Lifecycle hook for initialization logic (e.g., loading ideas).
 *  - `OnDestroy`: Lifecycle hook for cleanup logic (e.g., unsubscribing from observables).
 */
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
  styleUrls: ['./idea-list.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdeaListComponent implements OnInit {

  private onlineStatusService = inject(OnlineStatusService);
  private storageService = inject(StorageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals for component state
  /** Array holding all ideas retrieved from storage, before any filtering or pagination. */
  allIdeas = signal<Idea[]>([]);
  /** Boolean flag indicating the current online status of the application. */
  isOnline = signal(false);
  /** Boolean flag to indicate if data is currently being loaded (e.g., from storage). */
  isLoading = signal(true);
  /** Stores an error message string if an error occurs during data loading or processing. Null otherwise. */
  errorMessage = signal<string | null>(null);

  /** The number of ideas to display per page. */
  pageSize = signal(10);
  /** The current page index (0-based) for pagination. */
  currentPage = signal(0);
  /** The search term entered by the user for filtering ideas. */
  searchTerm = signal('');

  /** Reference to the MatPaginator component instance in the template. Used to control pagination. */
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /** Regular expression used to validate if a storage key is a UUID. */
  private uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  /** Computed signal for ideas filtered by the search term. */
  filteredIdeas = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const ideas = this.allIdeas();
    if (!term) {
      return ideas;
    }
    return ideas.filter(idea => idea.text && idea.text.toLowerCase().includes(term));
  });

  /** Computed signal for the total number of ideas after filtering, used by the paginator. */
  totalIdeas = computed(() => this.filteredIdeas().length);

  /** Computed signal for the subset of ideas currently displayed on the active page. */
  displayedIdeas = computed(() => {
    const ideas = this.filteredIdeas();
    const pageIndex = this.currentPage();
    const size = this.pageSize();
    const startIndex = pageIndex * size;
    const endIndex = startIndex + size;
    return ideas.slice(startIndex, endIndex);
  });

  /**
   * Constructs the IdeaListComponent.
   * Injects required services for online status monitoring, local storage interaction, and routing.
   * @param {OnlineStatusService} onlineStatusService - Service to get current online status.
   * @param {StorageService} storageService - Service to interact with local storage for ideas.
   * @param {Router} router - Angular's Router service for navigation.
   */
  constructor() { }

  /**
   * Angular lifecycle hook called after component initialization.
   * It triggers the loading of valid ideas from storage and subscribes to online status updates.
   * The subscription to online status is managed using `takeUntilDestroyed` to prevent memory leaks.
   */
  ngOnInit(): void {
    this.loadValidIdeas();
    this.onlineStatusService.isOnline$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOnline) => {
        this.isOnline.set(isOnline);
      });
  }

  /**
   * Validates if a given key string matches the UUID format.
   * @param {string} key - The key string to validate.
   * @returns {boolean} True if the key is a valid UUID, false otherwise.
   * @private
   */
  private isValidUuid(key: string): boolean {
    return this.uuidRegex.test(key);
  }

  /**
   * Asynchronously loads all valid ideas from local storage.
   * It retrieves all keys from storage, filters them to keep only valid UUIDs,
   * then fetches and processes each corresponding idea.
   * Updates `allIdeas`, applies filtering and pagination, and manages loading/error states.
   * @async
   */
  async loadValidIdeas(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.allIdeas.set([]); // Reset before loading

    try {
      const allKeys = await this.storageService.getAllKeys();
      const validUuidKeys = allKeys.filter(key => this.isValidUuid(key));
      // console.log(`Found ${validUuidKeys.length} valid UUID keys out of ${allKeys.length} total.`);

      const ideaPromises = validUuidKeys.map(async (uuid) => {
        try {
          const retrievedData = await this.storageService.getItem<Idea>(uuid);
          if (retrievedData) {
            retrievedData.id = uuid; // Ensure the idea object has its ID
            return retrievedData;
          } else {
            // console.warn(`No data found for valid UUID: ${uuid}`);
            return null;
          }
        } catch (itemError) {
          console.error(`Error retrieving or processing item for UUID ${uuid}:`, itemError);
          return null;
        }
      });

      const resolvedIdeas = await Promise.all(ideaPromises);
      this.allIdeas.set(resolvedIdeas.filter((idea): idea is Idea => idea !== null));
      // Reset to first page if current page becomes invalid, though usually fine on initial load
      this.currentPage.set(0);
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }

    } catch (error) {
      console.error('Error loading keys or ideas:', error);
      this.errorMessage.set(`Unable to load the list of ideas. ${error instanceof Error ? error.message : String(error)}`);
      this.allIdeas.set([]); // Ensure lists are empty on error
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Called when the search input value changes.
   * Updates the search term signal and resets pagination to the first page.
   */
  onSearchChange(newSearchTerm: string): void {
    this.searchTerm.set(newSearchTerm);
    this.currentPage.set(0);
    if (this.paginator) {
      this.paginator.pageIndex = 0; // Or this.paginator.firstPage();
    }
  }

  /**
   * Clears the search term and re-applies filtering and pagination,
   * effectively showing all ideas again (or the first page of all ideas).
   */
  clearSearch(): void {
    this.onSearchChange(''); // This will set searchTerm and reset pagination
  }

  /**
   * Handles page change events from the `MatPaginator`.
   * Updates `currentPage` and `pageSize` based on the event and then refreshes the `displayedIdeas`.
   * @param {PageEvent} event - The page event object from `MatPaginator`.
   */
  handlePageEvent(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  /**
   * Navigates to the detailed view ('jobcard') of a specific idea.
   * @param {(string | number | undefined)} ideaId - The ID of the idea to view.
   *        If undefined, a warning is logged, and navigation is skipped.
   */
  viewIdeaDetails(ideaId: string | number | undefined): void {
    if (!ideaId) {
      console.warn('Navigation without ID.');
      return;
    }
    this.router.navigate(['/jobcard', ideaId]);
  }

  /**
   * Updates the list of ideas after an idea has been deleted (e.g., by a child `CardIdeaComponent`).
   * It removes the idea with the given ID from `allIdeas` and then re-applies filtering and pagination.
   * @param {string} deletedIdeaId - The UUID of the idea that was deleted.
   */
  updateCardIdea(deletedIdeaId: string): void {
    if (!deletedIdeaId) {
      console.warn('updateCardIdea called without a deletedIdeaId.');
      return;
    }

    this.allIdeas.update(ideas => ideas.filter(idea => idea.id !== deletedIdeaId));

    // Adjust current page if it becomes invalid after deletion
    const totalPages = Math.ceil(this.totalIdeas() / this.pageSize());
    if (this.currentPage() >= totalPages && totalPages > 0) {
      this.currentPage.set(totalPages - 1);
    } else if (totalPages === 0 && this.currentPage() !== 0) { // Handles case where list becomes empty
      this.currentPage.set(0);
    }

    // Ensure paginator reflects the change if current page was adjusted
    if (this.paginator && this.paginator.pageIndex !== this.currentPage()) {
      this.paginator.pageIndex = this.currentPage();
    }
  }
}