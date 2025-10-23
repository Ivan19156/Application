// import { Component, Input, inject, OnInit } from '@angular/core';
// import { DatePipe, NgIf, AsyncPipe } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { BehaviorSubject, Observable, combineLatest, EMPTY, of } from 'rxjs';
// import { catchError, finalize, map, tap } from 'rxjs/operators';

// import { Event } from '../../../../core/services/event.service';
// import { ParticipationService } from '../../../../core/services/participation.service'; 

// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSnackBar } from '@angular/material/snack-bar';


// interface EventCardViewModel {
//     isJoined: boolean;
//     isLoading: boolean;
//     isFull: boolean;
//     event: Event;
// }

// @Component({
//     selector: 'app-event-card',
//     standalone: true,
//     imports: [NgIf, DatePipe, RouterModule, AsyncPipe, MatCardModule, MatButtonModule, MatIconModule],
//     templateUrl: './event-card.component.html',
//     styleUrl: './event-card.component.scss'
// })
// export class EventCardComponent implements OnInit {
//     @Input() event!: Event;

//     private participationService = inject(ParticipationService); 
//     private snackBar = inject(MatSnackBar);

//     private isLoading$ = new BehaviorSubject<boolean>(false);
//     vm$!: Observable<EventCardViewModel>;

//     ngOnInit(): void {
//         const isJoined$ = this.participationService.isJoined(this.event.id);

//         const isFull = this.event.capacity !== null && this.event.participants >= this.event.capacity;

//         this.vm$ = combineLatest({
//             isJoined: isJoined$,
//             isLoading: this.isLoading$.asObservable(),
//             isFull: of(isFull), 
//             event: of(this.event) 
//         });
//     }

//     join(): void {
//         if (this.isLoading$.value) return;
//         this.isLoading$.next(true);

//         this.participationService.joinEvent(this.event.id).pipe(
//             tap(() => this.showSuccess('Joined event!')),
//             catchError(err => {
//                 this.showError(err.message || 'Failed to join');
//                 return EMPTY;
//             }),
//             finalize(() => this.isLoading$.next(false))
//         ).subscribe();
//     }

//     leave(): void {
//         if (this.isLoading$.value) return;
//         this.isLoading$.next(true);

//         this.participationService.leaveEvent(this.event.id).pipe(
//             tap(() => this.showSuccess('Left event.')),
//             catchError(err => {
//                 this.showError(err.message || 'Failed to leave');
//                 return EMPTY;
//             }),
//             finalize(() => this.isLoading$.next(false))
//         ).subscribe();
//     }

//     stopPropagation(event: MouseEvent): void {
//         event.preventDefault();
//         event.stopPropagation();
//     }

//     private showSuccess(message: string): void {
//         this.snackBar.open(message, 'Close', { duration: 2000 });
//     }
//     private showError(message: string): void {
//         this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
//     }
// }

import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe, NgIf, AsyncPipe, NgFor } from '@angular/common'; // 👈 Додано NgFor
import { RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, EMPTY, of } from 'rxjs';
import { catchError, finalize, map, tap, filter } from 'rxjs/operators';

// Services
import { Event } from '../../../../core/services/event.service';
import { ParticipationService } from '../../../../core/services/participation.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips'; // 👈 Імпортуємо модуль для чіпсів

// ViewModel
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
        NgIf, DatePipe, RouterModule, AsyncPipe, NgFor, // 👈 Додано NgFor
        MatCardModule, MatButtonModule, MatIconModule,
        MatChipsModule // 👈 Додано сюди
    ],
    templateUrl: './event-card.component.html',
    styleUrl: './event-card.component.scss'
})
export class EventCardComponent implements OnInit, OnChanges {
    @Input() event!: Event;

    private participationService = inject(ParticipationService);
    private snackBar = inject(MatSnackBar);

    private isLoading$ = new BehaviorSubject<boolean>(false);
    private event$ = new BehaviorSubject<Event | null>(null);

    vm$!: Observable<EventCardViewModel>;

    ngOnInit(): void {
        this.event$.next(this.event);

        const isJoined$ = this.participationService.isJoined(this.event.id);
        
        const isFull$ = this.event$.pipe(
            map(event => event ? (event.capacity !== null && event.participants >= event.capacity) : false)
        );

        const validEvent$ = this.event$.pipe(filter((e): e is Event => e !== null));

        this.vm$ = combineLatest({
            isJoined: isJoined$,
            isLoading: this.isLoading$.asObservable(),
            isFull: isFull$,
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

