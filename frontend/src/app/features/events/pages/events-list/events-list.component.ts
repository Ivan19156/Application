// import { Component, OnInit, inject } from '@angular/core';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
// import { Observable, Subject, combineLatest, of, BehaviorSubject } from 'rxjs';
// import { map, startWith, switchMap, catchError, debounceTime, distinctUntilChanged, shareReplay, tap } from 'rxjs/operators';
// import { AsyncPipe, NgFor, NgIf } from '@angular/common';

// import { Event, EventService, PaginatedEvents } from '../../../../core/services/event.service';

// import { EventCardComponent } from '../../components/event-card/event-card.component';

// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatPaginatorModule } from '@angular/material/paginator';

// interface EventsListViewModel {
//   events: Event[];
//   isLoading: boolean;
//   searchTerm: string;
//   hasError: boolean;
//   totalCount: number;
//   currentPage: number;
//   totalPages: number;
//   pageSize: number;
//   hasNextPage: boolean;
//   hasPreviousPage: boolean;
// }

// @Component({
//   selector: 'app-events-list',
//   standalone: true,
//   imports: [
//     NgFor,
//     NgIf,
//     AsyncPipe,
//     ReactiveFormsModule,
//     EventCardComponent,
//     MatFormFieldModule,
//     MatInputModule,
//     MatIconModule,
//     MatButtonModule,
//     MatProgressSpinnerModule,
//     MatPaginatorModule
//   ],
//   templateUrl: './events-list.component.html',
//   styleUrl: './events-list.component.scss'
// })
// export class EventsListComponent implements OnInit {
//   private eventService = inject(EventService);

//   searchControl = new FormControl('');
//   private searchTrigger$ = new Subject<void>();
  
//   private currentPage$ = new BehaviorSubject<number>(1);
//   private pageSize$ = new BehaviorSubject<number>(12);

//   vm$!: Observable<EventsListViewModel>;

//   ngOnInit(): void {
//     this.setupSearchStream();
//   }

//   private setupSearchStream(): void {
//     const manualSearch$ = this.searchTrigger$.pipe(
//       map(() => this.searchControl.value || '')
//     );

//     const autoSearch$ = this.searchControl.valueChanges.pipe(
//       debounceTime(500),
//       distinctUntilChanged(),
//       map(value => value || '')
//     );

//     const searchTerm$ = combineLatest([
//       manualSearch$.pipe(startWith('')),
//       autoSearch$.pipe(startWith(''))
//     ]).pipe(
//       map(([manual, auto]) => manual || auto),
//       distinctUntilChanged(),
//       tap(() => this.currentPage$.next(1)),
//       shareReplay(1)
//     );
//     const paginatedEvents$ = combineLatest([
//       searchTerm$,
//       this.currentPage$,
//       this.pageSize$
//     ]).pipe(
//       switchMap(([searchTerm, page, pageSize]) => {
//         console.log(`🔍 Loading page ${page} with search: "${searchTerm}"`);
        
//         return this.eventService.getEvents(searchTerm, page, pageSize).pipe(
//           map(result => ({ ...result, hasError: false })),
//           catchError(error => {
//             console.error('Failed to load events:', error);
//             return of({
//               events: [],
//               totalCount: 0,
//               pageNumber: page,
//               pageSize: pageSize,
//               totalPages: 0,
//               hasNextPage: false,
//               hasPreviousPage: false,
//               hasError: true
//             });
//           })
//         );
//       }),
//       shareReplay(1)
//     );
//     const isLoading$ = combineLatest([searchTerm$, this.currentPage$]).pipe(
//       switchMap(() => 
//         of(true).pipe(
//           switchMap(() => 
//             paginatedEvents$.pipe(
//               map(() => false),
//               startWith(true)
//             )
//           )
//         )
//       ),
//       startWith(true)
//     );

  
//     this.vm$ = combineLatest({
//       paginatedData: paginatedEvents$,
//       isLoading: isLoading$,
//       searchTerm: searchTerm$,
//       currentPage: this.currentPage$,
//       pageSize: this.pageSize$
//     }).pipe(
//       map(({ paginatedData, isLoading, searchTerm, currentPage, pageSize }) => ({
//         events: paginatedData.events,
//         isLoading,
//         searchTerm,
//         hasError: paginatedData.hasError,
//         totalCount: paginatedData.totalCount,
//         currentPage,
//         totalPages: paginatedData.totalPages,
//         pageSize,
//         hasNextPage: paginatedData.hasNextPage,
//         hasPreviousPage: paginatedData.hasPreviousPage
//       }))
//     );
//   }

//   onSearch(): void {
//     this.searchTrigger$.next();
//   }
//   onSearchKeydown(event: KeyboardEvent): void {
//     if (event.key === 'Enter') {
//       this.onSearch();
//     }
//   }

//   clearSearch(): void {
//     this.searchControl.setValue('');
//     this.currentPage$.next(1);
//     this.searchTrigger$.next();
//   }

//   goToPage(page: number): void {
//     this.currentPage$.next(page);
//     this.scrollToTop();
//   }

//   nextPage(): void {
//     const currentPage = this.currentPage$.value;
//     this.currentPage$.next(currentPage + 1);
//     this.scrollToTop();
//   }

//   previousPage(): void {
//     const currentPage = this.currentPage$.value;
//     if (currentPage > 1) {
//       this.currentPage$.next(currentPage - 1);
//       this.scrollToTop();
//     }
//   }

//   changePageSize(newSize: number): void {
//     this.pageSize$.next(newSize);
//     this.currentPage$.next(1); 
//   }

//   trackByEventId(index: number, event: Event): string {
//     return event.id;
//   }
  
//   private scrollToTop(): void {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   }
// }

import { Component, OnInit, inject, HostListener, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, combineLatest, Subscription, of } from 'rxjs';
import { map, startWith, switchMap, debounceTime, distinctUntilChanged, tap, take, scan, shareReplay, finalize, catchError } from 'rxjs/operators';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';

// Services
import { Event, EventService, PaginatedEvents } from '../../../../core/services/event.service';

// Child Components
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { TagFilterComponent } from '../../components/tag-filter/tag-filter.component';

// Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ViewModel
interface EventsListViewModel {
  events: Event[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  hasActiveFilters: boolean; // 👈 Додаємо новий прапорець
}

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    NgFor, NgIf, AsyncPipe, ReactiveFormsModule,
    EventCardComponent, TagFilterComponent,
    MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './events-list.component.html',
  styleUrl: './events-list.component.scss'
})
export class EventsListComponent implements OnInit, OnDestroy {
  private eventService = inject(EventService);
  searchControl = new FormControl('', { nonNullable: true });
  
  private page$ = new BehaviorSubject<number>(1);
  private pageSize = 9;
  private selectedTags$ = new BehaviorSubject<string[]>([]);
  private isLoading$ = new BehaviorSubject<boolean>(true);

  vm$!: Observable<EventsListViewModel>;
  private vmSubscription!: Subscription;

  ngOnInit(): void {
    const searchTerm$ = this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      startWith(''),
      tap(() => this.page$.next(1))
    );
    
    const filters$ = combineLatest([searchTerm$, this.selectedTags$]);

    const pageLoad$ = combineLatest([filters$, this.page$]).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap(([[searchTerm, tags], page]) =>
        this.eventService.getEvents(searchTerm, page, this.pageSize, tags).pipe(
          catchError(() => of({ events: [], pageNumber: 1, hasNextPage: false, totalCount: 0 } as unknown as PaginatedEvents)),
          finalize(() => this.isLoading$.next(false))
        )
      ),
      shareReplay(1)
    );

    const allEvents$ = pageLoad$.pipe(
      scan((acc, paginatedResult) => {
        if (paginatedResult.pageNumber === 1) return paginatedResult.events;
        return [...acc, ...paginatedResult.events];
      }, [] as Event[])
    );

    this.vm$ = combineLatest({
      events: allEvents$,
      paginatedData: pageLoad$,
      currentPage: this.page$,
      isLoading: this.isLoading$.asObservable(),
      // 👇 Додаємо поточні фільтри до ViewModel 👇
      filters: filters$ 
    }).pipe(
      map(({ events, paginatedData, currentPage, isLoading, filters }) => {
        const [searchTerm, selectedTags] = filters;
        return {
          events: events,
          isLoading: currentPage === 1 && isLoading,
          isLoadingMore: currentPage > 1 && isLoading,
          hasMore: paginatedData.hasNextPage,
          totalCount: paginatedData.totalCount,
          // 👇 Обчислюємо, чи є активні фільтри 👇
          hasActiveFilters: !!searchTerm || selectedTags.length > 0
        };
      })
    );
    
    this.vmSubscription = this.vm$.subscribe();
  }

  ngOnDestroy(): void {
    this.vmSubscription?.unsubscribe();
  }

  onTagSelectionChange(selectedTags: string[]): void {
    this.page$.next(1);
    this.selectedTags$.next(selectedTags);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    // onTagSelectionChange([]) // Можна також додати очищення тегів
  }

  loadMore(): void {
    const nextPage = this.page$.value + 1;
    this.page$.next(nextPage);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition >= documentHeight * 0.95) {
        this.vm$.pipe(take(1)).subscribe(vm => {
            if (vm.hasMore && !vm.isLoading && !vm.isLoadingMore) {
                this.loadMore();
            }
        });
    }
  }

  trackByEventId(index: number, event: Event): string { return event.id; }
}

