import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subject, combineLatest, of, EMPTY, BehaviorSubject } from 'rxjs';
import { map, switchMap, shareReplay, catchError, tap, startWith, filter, finalize } from 'rxjs/operators';
import { DatePipe, NgIf, AsyncPipe, NgFor } from '@angular/common';

import { Event, EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ParticipationService } from '../../../../core/services/participation.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips'; 

interface EventDetailsViewModel {
  event: Event | null;
  isOrganizer: boolean;
  isJoined: boolean;
  isFull: boolean;
  isLoading: boolean;
  isActionInProgress: boolean;
}

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [
    NgIf, DatePipe, RouterLink, NgFor, AsyncPipe,
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss'
})
export class EventDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private participationService = inject(ParticipationService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  private refreshTrigger$ = new Subject<void>();
  private actionInProgress$ = new BehaviorSubject<boolean>(false);

  vm$!: Observable<EventDetailsViewModel>;

  ngOnInit(): void {
    const eventId$ = this.route.paramMap.pipe(
      map(params => params.get('id')),
      filter((id): id is string => id !== null),
      shareReplay(1)
    );

    const event$ = combineLatest([eventId$, this.refreshTrigger$.pipe(startWith(null))]).pipe(
      switchMap(([id]) => this.eventService.getEventById(id).pipe(
        catchError(() => { this.showError('Failed to load event'); return of(null); })
      )),
      shareReplay(1)
    );
    
    const isJoined$ = eventId$.pipe(
      switchMap(id => this.participationService.isJoined(id))
    );

    const isOrganizer$ = event$.pipe(
      map(event => {
        const currentUserId = this.authService.getCurrentUserId();
        return !!event && !!currentUserId && event.organizerId === currentUserId;
      }),
      startWith(false)
    );

    const isFull$ = event$.pipe(
      map(event => event ? (event.capacity !== null && event.participants >= event.capacity) : false)
    );

    const isLoading$ = event$.pipe(map(event => event === undefined), startWith(true));

    this.vm$ = combineLatest({
      event: event$.pipe(map(e => e ?? null)),
      isOrganizer: isOrganizer$,
      isJoined: isJoined$,
      isFull: isFull$,
      isLoading: isLoading$,
      isActionInProgress: this.actionInProgress$.asObservable()
    });
  }


  join(eventId: string): void {
    if (this.actionInProgress$.value) return;
    this.actionInProgress$.next(true);

    this.participationService.joinEvent(eventId).pipe(
      tap(() => {
        this.showSuccess('Successfully joined the event!');
        this.refreshTrigger$.next(); 
      }),
      catchError(err => { this.showError(err.message || 'Failed to join event'); return EMPTY; }),
      finalize(() => this.actionInProgress$.next(false))
    ).subscribe();
  }

  leave(eventId: string): void {
    if (this.actionInProgress$.value) return;
    this.actionInProgress$.next(true);

    this.participationService.leaveEvent(eventId).pipe(
      tap(() => {
        this.showSuccess('You have left the event');
        this.refreshTrigger$.next();
      }),
      catchError(err => { this.showError(err.message || 'Failed to leave event'); return EMPTY; }),
      finalize(() => this.actionInProgress$.next(false))
    ).subscribe();
  }

  editEvent(eventId: string): void { this.router.navigate(['/events', eventId, 'edit']); }

  deleteEvent(eventId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().pipe(
        filter(result => result === true),
        tap(() => this.actionInProgress$.next(true)),
        switchMap(() => this.eventService.deleteEvent(eventId)),
        tap(success => {
            if (success) {
                this.showSuccess('Event deleted successfully!');
                this.router.navigate(['/events']);
            } else {
                this.showError('Failed to delete event');
            }
        }),
        catchError(err => {
            this.showError(err.message || 'Error deleting event');
            return EMPTY;
        }),
        finalize(() => this.actionInProgress$.next(false))
    ).subscribe();
  }


  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
  }
}


