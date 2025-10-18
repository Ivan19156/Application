import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subject, combineLatest, of, EMPTY, BehaviorSubject } from 'rxjs';
import { map, switchMap, shareReplay, catchError, tap, startWith, filter, finalize } from 'rxjs/operators';
import { DatePipe, NgIf, AsyncPipe, NgFor } from '@angular/common';

// Services and Interfaces
import { Event, EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service'; // For organizer check

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Import the separated dialog component
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component'; // Correct path

// --- ViewModel Interface ---
interface EventDetailsViewModel {
  event: Event | null;           // The current event data or null if not found/loading
  isOrganizer: boolean;        // Is the current user the organizer?
  isJoined: boolean;           // Is the current user joined? (Simulated)
  isFull: boolean;             // Is the event capacity reached?
  isLoading: boolean;          // Is the initial event data loading?
  isActionInProgress: boolean; // Is a join/leave/delete action happening?
}

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    RouterLink,
    NgFor,
    AsyncPipe, // Add AsyncPipe back
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss'
})
export class EventDetailsComponent implements OnInit {
  // --- Injected Services ---
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // --- State Subjects ---
  private refreshTrigger$ = new Subject<void>(); // Trigger to refetch event data
  private actionInProgress$ = new BehaviorSubject<boolean>(false); // For join/leave/delete loading state
  private isJoined$ = new BehaviorSubject<boolean>(false); // Simulation of join status

  // --- ViewModel Observable ---
  vm$!: Observable<EventDetailsViewModel>;

  ngOnInit(): void {
    // 1. Get Event ID from Route
    const eventId$ = this.route.paramMap.pipe(
      map(params => params.get('id')),
      filter((id): id is string => id !== null), // Ensure ID is not null
      tap(id => { if (!id) this.showErrorAndNavigate('Event ID missing'); }), // Handle missing ID early
      shareReplay(1)
    );

    // Initial loading state indicator
    const isLoading$ = new BehaviorSubject<boolean>(true);

    // 2. Load Event Data (refreshes on refreshTrigger$)
    const event$ = combineLatest([eventId$, this.refreshTrigger$.pipe(startWith(null))]).pipe(
      tap(() => isLoading$.next(true)), // Start loading indicator
      switchMap(([id]) => this.eventService.getEventById(id).pipe(
          catchError(error => { // Handle errors during fetch
            console.error('Error loading event:', error);
            this.showError('Failed to load event');
            return of(null); // Emit null on error
          })
        )
      ),
      tap(() => isLoading$.next(false)), // Stop loading indicator
      shareReplay(1)
    );

    // 3. Determine Organizer Status
    const isOrganizer$ = event$.pipe(
      map(event => {
        const currentUserId = this.authService.getCurrentUserId();
        return !!event && !!currentUserId && event.organizerId === currentUserId;
        // Example for testing: return !!event && event.organizerId === 'user1';
      }),
      startWith(false)
    );

    // 4. Determine if Event is Full
    const isFull$ = event$.pipe(
      map(event => event ? (event.capacity !== null && event.participants >= event.capacity) : false),
      startWith(false)
    );

    // 5. Combine all streams into the ViewModel
    this.vm$ = combineLatest({
      event: event$.pipe(map(e => e ?? null)), // Map undefined/null from service to null
      isOrganizer: isOrganizer$,
      isJoined: this.isJoined$.asObservable(),
      isFull: isFull$,
      isLoading: isLoading$.asObservable(), // Use the dedicated loading stream
      isActionInProgress: this.actionInProgress$.asObservable()
    }).pipe(
       tap(vm => console.log("VM Update:", vm)) // Optional: Log VM changes
    );

     // TODO: Load initial join status from service if available
     // this.loadInitialJoinStatus(eventId$);
  }

  // --- Action Methods (called from template) ---

  join(eventId: string): void {
    if (this.actionInProgress$.value) return;
    this.actionInProgress$.next(true);

    this.eventService.joinEvent(eventId).pipe(
      tap(() => {
        this.isJoined$.next(true); // Update join status
        this.refreshTrigger$.next(); // Trigger event data refresh (updates participant count via event$)
        this.showSuccess('Successfully joined the event!');
      }),
      catchError(error => {
        console.error('Failed to join:', error);
        this.showError(error?.message || 'Failed to join event');
        return EMPTY; // Stop the stream on error
      }),
      finalize(() => this.actionInProgress$.next(false)) // Reset loading state
    ).subscribe(); // Subscribe to trigger the action
  }

  leave(eventId: string): void {
    if (this.actionInProgress$.value) return;
    this.actionInProgress$.next(true);

    this.eventService.leaveEvent(eventId).pipe(
      tap(() => {
        this.isJoined$.next(false); // Update join status
        this.refreshTrigger$.next(); // Trigger event data refresh
        this.showSuccess('You have left the event');
      }),
      catchError(error => {
        console.error('Failed to leave:', error);
        this.showError(error?.message || 'Failed to leave event');
        return EMPTY;
      }),
      finalize(() => this.actionInProgress$.next(false))
    ).subscribe();
  }

  editEvent(eventId: string): void {
    this.router.navigate(['/events', eventId, 'edit']);
  }

  deleteEvent(eventId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    // Handle dialog result reactively
    dialogRef.afterClosed().pipe(
      filter(result => result === true), // Only proceed if confirmed
      tap(() => this.actionInProgress$.next(true)), // Set loading state
      switchMap(() => this.eventService.deleteEvent(eventId).pipe( // Call delete service
        tap(success => {
          if (success) {
            this.showSuccess('Event deleted successfully!');
            this.router.navigate(['/events']); // Navigate back to list
          } else {
            this.showError('Failed to delete event');
          }
        }),
        catchError(error => { // Handle errors from delete service
          console.error('Error deleting event:', error);
          this.showError('An error occurred while deleting');
          return EMPTY;
        }),
        finalize(() => this.actionInProgress$.next(false)) // Reset loading state in all cases
      ))
    ).subscribe(); // Subscribe to trigger the action chain
  }

  // --- Helper Methods ---

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
    });
  }

   private showErrorAndNavigate(message: string): void {
       this.showError(message);
       this.router.navigate(['/events']);
   }
}