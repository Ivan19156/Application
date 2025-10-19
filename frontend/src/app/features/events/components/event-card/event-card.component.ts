import { Component, Input, inject, OnInit } from '@angular/core';
import { DatePipe, NgIf, AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, EMPTY, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { Event } from '../../../../core/services/event.service';
import { ParticipationService } from '../../../../core/services/participation.service'; 

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';


interface EventCardViewModel {
    isJoined: boolean;
    isLoading: boolean;
    isFull: boolean;
    event: Event;
}

@Component({
    selector: 'app-event-card',
    standalone: true,
    imports: [NgIf, DatePipe, RouterModule, AsyncPipe, MatCardModule, MatButtonModule, MatIconModule],
    templateUrl: './event-card.component.html',
    styleUrl: './event-card.component.scss'
})
export class EventCardComponent implements OnInit {
    @Input() event!: Event;

    private participationService = inject(ParticipationService); 
    private snackBar = inject(MatSnackBar);

    private isLoading$ = new BehaviorSubject<boolean>(false);
    vm$!: Observable<EventCardViewModel>;

    ngOnInit(): void {
        const isJoined$ = this.participationService.isJoined(this.event.id);

        const isFull = this.event.capacity !== null && this.event.participants >= this.event.capacity;

        this.vm$ = combineLatest({
            isJoined: isJoined$,
            isLoading: this.isLoading$.asObservable(),
            isFull: of(isFull), 
            event: of(this.event) 
        });
    }

    join(): void {
        if (this.isLoading$.value) return;
        this.isLoading$.next(true);

        this.participationService.joinEvent(this.event.id).pipe(
            tap(() => this.showSuccess('Joined event!')),
            catchError(err => {
                this.showError(err.message || 'Failed to join');
                return EMPTY;
            }),
            finalize(() => this.isLoading$.next(false))
        ).subscribe();
    }

    leave(): void {
        if (this.isLoading$.value) return;
        this.isLoading$.next(true);

        this.participationService.leaveEvent(this.event.id).pipe(
            tap(() => this.showSuccess('Left event.')),
            catchError(err => {
                this.showError(err.message || 'Failed to leave');
                return EMPTY;
            }),
            finalize(() => this.isLoading$.next(false))
        ).subscribe();
    }

    stopPropagation(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Close', { duration: 2000 });
    }
    private showError(message: string): void {
        this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
    }
}

