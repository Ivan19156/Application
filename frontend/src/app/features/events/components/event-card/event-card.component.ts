import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe, NgIf, AsyncPipe, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, EMPTY, of } from 'rxjs';
import { catchError, finalize, map, tap, filter, startWith } from 'rxjs/operators';

import { Event } from '../../../../core/services/event.service';
import { ParticipationService } from '../../../../core/services/participation.service';
import { AuthService } from '../../../../core/services/auth.service'; 

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

interface EventCardViewModel {
    isJoined: boolean;
    isLoading: boolean;
    isFull: boolean;
    isOrganizer: boolean; 
    event: Event;
}

@Component({
    selector: 'app-event-card',
    standalone: true,
    imports: [
        NgIf, DatePipe, RouterModule, AsyncPipe, NgFor,
        MatCardModule, MatButtonModule, MatIconModule,
        MatChipsModule
    ],
    templateUrl: './event-card.component.html',
    styleUrl: './event-card.component.scss'
})
export class EventCardComponent implements OnInit, OnChanges {
    @Input() event!: Event;

    private participationService = inject(ParticipationService);
    private authService = inject(AuthService); 
    private snackBar = inject(MatSnackBar);

    private isLoading$ = new BehaviorSubject<boolean>(false);
    private event$ = new BehaviorSubject<Event | null>(null);

    vm$!: Observable<EventCardViewModel>;

    ngOnInit(): void {
        this.event$.next(this.event);

        const currentUserId = this.authService.getCurrentUserId();
    console.log('🔍 EventCard Init - currentUserId:', currentUserId);
    console.log('🔍 EventCard Init - event:', this.event);
    console.log('🔍 EventCard Init - event.organizerId:', this.event?.organizerId);

        const isJoined$ = this.participationService.isJoined(this.event.id);
        
        const isFull$ = this.event$.pipe(
            map(event => event ? (event.capacity !== null && event.participants >= event.capacity) : false)
        );

        
        const isOrganizer$ = this.event$.pipe(
    map(event => {
        const currentUserId = this.authService.getCurrentUserId();
        return !!event && !!currentUserId && event.organizerId === currentUserId;
    }),
    startWith(false)
);

        const validEvent$ = this.event$.pipe(filter((e): e is Event => e !== null));

        this.vm$ = combineLatest({
            isJoined: isJoined$,
            isLoading: this.isLoading$.asObservable(),
            isFull: isFull$,
            isOrganizer: isOrganizer$,
            event: validEvent$
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['event']) {
            this.event$.next(changes['event'].currentValue);
        }
    }

    join(): void {
        if (this.isLoading$.value) return;
        this.isLoading$.next(true);

        this.participationService.joinEvent(this.event.id).pipe(
            tap(() => this.showSuccess('Joined event!')),
            catchError(err => { this.showError(err.message || 'Failed to join'); return EMPTY; }),
            finalize(() => this.isLoading$.next(false))
        ).subscribe();
    }

    leave(): void {
        if (this.isLoading$.value) return;
        this.isLoading$.next(true);

        this.participationService.leaveEvent(this.event.id).pipe(
            tap(() => this.showSuccess('Left event.')),
            catchError(err => { this.showError(err.message || 'Failed to leave'); return EMPTY; }),
            finalize(() => this.isLoading$.next(false))
        ).subscribe();
    }

    stopPropagation(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    private showSuccess(message: string): void { this.snackBar.open(message, 'Close', { duration: 2000 }); }
    private showError(message: string): void { this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['error-snackbar'] }); }
}

