import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe, NgIf, AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, EMPTY } from 'rxjs';
import { catchError, finalize, tap, map, filter } from 'rxjs/operators';

// Services and Interfaces
import { Event, EventService } from '../../../../core/services/event.service';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // ✅ Важливо!
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// ViewModel Interface
interface EventCardViewModel {
    isJoined: boolean;
    isLoading: boolean;
    isFull: boolean;
    event: Event;
}

@Component({
    selector: 'app-event-card',
    standalone: true,
    imports: [
        NgIf,
        AsyncPipe,
        DatePipe,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule, // ✅ Додайте це!
        MatSnackBarModule
    ],
    templateUrl: './event-card.component.html',
    styleUrl: './event-card.component.scss'
})
export class EventCardComponent implements OnInit, OnChanges {
    // --- Inputs & Injections ---
    @Input() event!: Event;
    private eventService = inject(EventService);
    private snackBar = inject(MatSnackBar);

    // --- State Subjects ---
    private isJoined$ = new BehaviorSubject<boolean>(false);
    private isLoading$ = new BehaviorSubject<boolean>(false);
    private event$ = new BehaviorSubject<Event | null>(null);

    // --- ViewModel Observable ---
    vm$!: Observable<EventCardViewModel>;

    ngOnInit(): void {
        this.event$.next(this.event);

        // Перевірка чи подія заповнена
        const isFull$ = this.event$.pipe(
            map((event: Event | null) => {
                if (!event) return false;
                return event.capacity !== null && event.participants >= event.capacity;
            })
        );

        // Фільтруємо null події
        const validEvent$ = this.event$.pipe(
            filter((e): e is Event => e !== null)
        );

        // Комбінуємо все в ViewModel
        this.vm$ = combineLatest({
            isJoined: this.isJoined$.asObservable(),
            isLoading: this.isLoading$.asObservable(),
            isFull: isFull$,
            event: validEvent$
        });

        // TODO: Перевірити статус участі користувача
        // const currentUserId = this.authService.getCurrentUserId();
        // if (currentUserId) {
        //     this.checkUserParticipation(this.event.id, currentUserId);
        // }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['event'] && changes['event'].currentValue) {
            this.event$.next(changes['event'].currentValue);
        }
    }

    // --- Actions ---
    join(): void {
        if (this.isLoading$.value) return;
        
        this.isLoading$.next(true);
        
        this.eventService.joinEvent(this.event.id).pipe(
            tap(() => {
                this.isJoined$.next(true);
                // Оновлюємо кількість учасників локально
                const currentEvent = this.event$.value;
                if (currentEvent) {
                    currentEvent.participants++;
                    this.event$.next({ ...currentEvent });
                }
                this.showSuccess('Successfully joined the event!');
            }),
            catchError((error) => {
                console.error('Failed to join event:', error);
                this.showError('Failed to join event');
                return EMPTY;
            }),
            finalize(() => this.isLoading$.next(false))
        ).subscribe();
    }

    leave(): void {
        if (this.isLoading$.value) return;
        
        this.isLoading$.next(true);
        
        this.eventService.leaveEvent(this.event.id).pipe(
            tap(() => {
                this.isJoined$.next(false);
                // Оновлюємо кількість учасників локально
                const currentEvent = this.event$.value;
                if (currentEvent) {
                    currentEvent.participants--;
                    this.event$.next({ ...currentEvent });
                }
                this.showSuccess('You have left the event');
            }),
            catchError((error) => {
                console.error('Failed to leave event:', error);
                this.showError('Failed to leave event');
                return EMPTY;
            }),
            finalize(() => this.isLoading$.next(false))
        ).subscribe();
    }

    stopPropagation(event: MouseEvent): void {
        event.stopPropagation();
        event.preventDefault();
    }

    // --- Helpers ---
    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
        });
    }

    private showError(message: string): void {
        this.snackBar.open(message, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
        });
    }
}