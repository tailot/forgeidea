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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  styleUrls: ['./idea-list.component.sass']
})
export class IdeaListComponent implements OnInit, OnDestroy {

  /** Array holding all ideas retrieved from storage, before any filtering or pagination. */
  allIdeas: Idea[] = [];
  /** Array holding ideas after filtering based on the search term. */
  filteredIdeas: Idea[] = [];
  /** Array holding the subset of ideas currently displayed on the active page. */
  displayedIdeas: Idea[] = [];
  /** Boolean flag indicating the current online status of the application. */
  ifIsOnline: boolean = false;
  /** Boolean flag to indicate if data is currently being loaded (e.g., from storage). */
  isLoading = true;
  /** Stores an error message string if an error occurs during data loading or processing. Null otherwise. */
  errorMessage: string | null = null;

  /** The total number of ideas after filtering, used by the paginator. */
  totalIdeas = 0;
  /** The number of ideas to display per page. */
  pageSize = 10;
  /** The current page index (0-based) for pagination. */
  currentPage = 0;

  /** The search term entered by the user for filtering ideas. */
  searchTerm: string = '';

  /** Reference to the MatPaginator component instance in the template. Used to control pagination. */
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /** Regular expression used to validate if a storage key is a UUID. */
  private uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  /** Subject used to manage the teardown of observable subscriptions when the component is destroyed. */
  private destroy$ = new Subject<void>();


  /**
   * Constructs the IdeaListComponent.
   * Injects required services for online status monitoring, local storage interaction, and routing.
   * @param {OnlineStatusService} onlineStatusService - Service to get current online status.
   * @param {StorageService} storageService - Service to interact with local storage for ideas.
   * @param {Router} router - Angular's Router service for navigation.
   */
  constructor(
    private onlineStatusService: OnlineStatusService,
    private storageService: StorageService,
    private router: Router
  ) { }

  /**
   * Angular lifecycle hook called after component initialization.
   * It triggers the loading of valid ideas from storage and subscribes to online status updates.
   * The subscription to online status is managed using `takeUntil(this.destroy$)` to prevent memory leaks.
   */
  ngOnInit(): void {
    this.loadValidIdeas();
    this.onlineStatusService.isOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOnline) => {
        this.ifIsOnline = isOnline;
      });
  }

  /**
   * Angular lifecycle hook called just before the component is destroyed.
   * It completes the `destroy$` subject, which triggers the unsubscription
   * from any observables that were piped with `takeUntil(this.destroy$)`,
   * preventing memory leaks.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.isLoading = true;
    this.errorMessage = null;
    this.allIdeas = []; // Reset before loading

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
      this.allIdeas = resolvedIdeas.filter((idea): idea is Idea => idea !== null);
      this.applyFilterAndPaginate(); // Apply filter and pagination after loading all ideas

    } catch (error) {
      console.error('Error loading keys or ideas:', error);
      this.errorMessage = `Unable to load the list of ideas. ${error instanceof Error ? error.message : String(error)}`;
      this.allIdeas = []; // Ensure lists are empty on error
      this.filteredIdeas = [];
      this.totalIdeas = 0;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Applies the current search term to filter `allIdeas` and then updates pagination.
   * If the search term is empty, `filteredIdeas` becomes a copy of `allIdeas`.
   * Otherwise, `filteredIdeas` contains only ideas whose text (case-insensitive) includes the search term.
   * Resets pagination to the first page and updates the `displayedIdeas`.
   */
  applyFilterAndPaginate(): void {
    const filterValue = this.searchTerm.trim().toLowerCase();

    if (!filterValue) {
      this.filteredIdeas = [...this.allIdeas]; // Use a copy for filtering
    } else {
      this.filteredIdeas = this.allIdeas.filter(idea =>
        idea.text.toLowerCase().includes(filterValue)
      );
    }

    this.totalIdeas = this.filteredIdeas.length;
    this.currentPage = 0; // Reset to first page after filtering

    if (this.paginator) {
      this.paginator.firstPage(); // Reset paginator to the first page
    }

    this.updateDisplayedIdeas();
  }

  /**
   * Called when the search input value changes.
   * Triggers the filtering and pagination update.
   */
  onSearchChange(): void {
    this.applyFilterAndPaginate();
  }

  /**
   * Clears the search term and re-applies filtering and pagination,
   * effectively showing all ideas again (or the first page of all ideas).
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilterAndPaginate();
  }

  /**
   * Updates the `displayedIdeas` array based on the current page and page size.
   * This method slices the `filteredIdeas` array to get the subset for the current view.
   */
  updateDisplayedIdeas(): void {
    if (!this.filteredIdeas) return; // Guard against undefined filteredIdeas
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedIdeas = this.filteredIdeas.slice(startIndex, endIndex);
  }

  /**
   * Handles page change events from the `MatPaginator`.
   * Updates `currentPage` and `pageSize` based on the event and then refreshes the `displayedIdeas`.
   * @param {PageEvent} event - The page event object from `MatPaginator`.
   */
  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedIdeas();
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

    const initialCount = this.allIdeas.length;
    this.allIdeas = this.allIdeas.filter(idea => idea.id !== deletedIdeaId);

    if (this.allIdeas.length === initialCount) {
      // console.warn(`Idea with ID ${deletedIdeaId} not found in allIdeas. List not updated.`);
      // This might happen if the list was already updated or the ID was incorrect.
      // Depending on requirements, this might not be an issue, or could indicate a sync problem.
      // For now, just proceed to re-filter and paginate.
    }

    this.applyFilterAndPaginate();
  }
}