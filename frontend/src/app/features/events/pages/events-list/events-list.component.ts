import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, combineLatest, of, BehaviorSubject } from 'rxjs';
import { map, startWith, switchMap, catchError, debounceTime, distinctUntilChanged, shareReplay, tap } from 'rxjs/operators';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';

import { Event, EventService, PaginatedEvents } from '../../../../core/services/event.service';

import { EventCardComponent } from '../../components/event-card/event-card.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';

interface EventsListViewModel {
  events: Event[];
  isLoading: boolean;
  searchTerm: string;
  hasError: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    AsyncPipe,
    ReactiveFormsModule,
    EventCardComponent,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  templateUrl: './events-list.component.html',
  styleUrl: './events-list.component.scss'
})
export class EventsListComponent implements OnInit {
  private eventService = inject(EventService);

  searchControl = new FormControl('');
  private searchTrigger$ = new Subject<void>();
  
  private currentPage$ = new BehaviorSubject<number>(1);
  private pageSize$ = new BehaviorSubject<number>(12);

  vm$!: Observable<EventsListViewModel>;

  ngOnInit(): void {
    this.setupSearchStream();
  }

  private setupSearchStream(): void {
    const manualSearch$ = this.searchTrigger$.pipe(
      map(() => this.searchControl.value || '')
    );

    const autoSearch$ = this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      map(value => value || '')
    );

    const searchTerm$ = combineLatest([
      manualSearch$.pipe(startWith('')),
      autoSearch$.pipe(startWith(''))
    ]).pipe(
      map(([manual, auto]) => manual || auto),
      distinctUntilChanged(),
      tap(() => this.currentPage$.next(1)),
      shareReplay(1)
    );
    const paginatedEvents$ = combineLatest([
      searchTerm$,
      this.currentPage$,
      this.pageSize$
    ]).pipe(
      switchMap(([searchTerm, page, pageSize]) => {
        console.log(`🔍 Loading page ${page} with search: "${searchTerm}"`);
        
        return this.eventService.getEvents(searchTerm, page, pageSize).pipe(
          map(result => ({ ...result, hasError: false })),
          catchError(error => {
            console.error('Failed to load events:', error);
            return of({
              events: [],
              totalCount: 0,
              pageNumber: page,
              pageSize: pageSize,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
              hasError: true
            });
          })
        );
      }),
      shareReplay(1)
    );
    const isLoading$ = combineLatest([searchTerm$, this.currentPage$]).pipe(
      switchMap(() => 
        of(true).pipe(
          switchMap(() => 
            paginatedEvents$.pipe(
              map(() => false),
              startWith(true)
            )
          )
        )
      ),
      startWith(true)
    );

  
    this.vm$ = combineLatest({
      paginatedData: paginatedEvents$,
      isLoading: isLoading$,
      searchTerm: searchTerm$,
      currentPage: this.currentPage$,
      pageSize: this.pageSize$
    }).pipe(
      map(({ paginatedData, isLoading, searchTerm, currentPage, pageSize }) => ({
        events: paginatedData.events,
        isLoading,
        searchTerm,
        hasError: paginatedData.hasError,
        totalCount: paginatedData.totalCount,
        currentPage,
        totalPages: paginatedData.totalPages,
        pageSize,
        hasNextPage: paginatedData.hasNextPage,
        hasPreviousPage: paginatedData.hasPreviousPage
      }))
    );
  }

  onSearch(): void {
    this.searchTrigger$.next();
  }
  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.currentPage$.next(1);
    this.searchTrigger$.next();
  }

  goToPage(page: number): void {
    this.currentPage$.next(page);
    this.scrollToTop();
  }

  nextPage(): void {
    const currentPage = this.currentPage$.value;
    this.currentPage$.next(currentPage + 1);
    this.scrollToTop();
  }

  previousPage(): void {
    const currentPage = this.currentPage$.value;
    if (currentPage > 1) {
      this.currentPage$.next(currentPage - 1);
      this.scrollToTop();
    }
  }

  changePageSize(newSize: number): void {
    this.pageSize$.next(newSize);
    this.currentPage$.next(1); 
  }

  trackByEventId(index: number, event: Event): string {
    return event.id;
  }
  
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}