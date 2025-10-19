import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common'; 
import { Observable, Subscription, BehaviorSubject, combineLatest, of, EMPTY, throwError } from 'rxjs';
import { map, switchMap, tap, catchError, shareReplay, startWith, filter, take } from 'rxjs/operators';
import { format } from 'date-fns'; 

import { Event, EventService, CreateEventDto } from '../../../../core/services/event.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; 
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface EditEventViewModel {
    event: Event | null;
    isLoading: boolean;
    isSaving: boolean;
    eventId: string | null;
}

@Component({
    selector: 'app-edit-event',
    standalone: true,
    imports: [
        NgIf, AsyncPipe, ReactiveFormsModule, RouterModule,
        MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
        MatRadioModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
        NgxMaterialTimepickerModule, MatProgressSpinnerModule, MatSnackBarModule
    ],
    templateUrl: './edit-event.component.html',
    styleUrl: './edit-event.component.scss'
})
export class EditEventComponent implements OnInit {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private eventService = inject(EventService);
    private snackBar = inject(MatSnackBar);

    eventForm: FormGroup = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: [''],
        date: [null, [Validators.required]],
        time: ['', [Validators.required]],
        location: ['', [Validators.required]],
        capacity: [null, [Validators.min(1)]],
        visibility: ['Public', [Validators.required]]
    }, {
        validators: this.dateNotInPastValidator
    });
    minDate = new Date(); 

    private eventId$: Observable<string | null> = this.route.paramMap.pipe(
        map(params => params.get('id')),
        shareReplay(1) 
    );

    private isSaving$ = new BehaviorSubject<boolean>(false); 

    vm$!: Observable<EditEventViewModel>;

    ngOnInit(): void {
        const eventData$ = this.eventId$.pipe(
            switchMap(id => {
                if (!id) {
                    this.showErrorAndNavigate('Event ID missing');
                    return of(null); 
                }
                return this.eventService.getEventById(id).pipe(
                    tap(event => { 
                        if (event) {
                            this.patchForm(event);
                        } else {
                            this.showErrorAndNavigate('Event not found');
                        }
                    }),
                    catchError(error => {
                        console.error('Error loading event:', error);
                        this.showErrorAndNavigate('Failed to load event');
                        return of(null); 
                    })
                );
            }),
            shareReplay(1) 
        );

        const isLoading$ = eventData$.pipe(
            map(event => event === undefined), 
            startWith(true) 
        );

        this.vm$ = combineLatest({
    event: eventData$.pipe(map(e => e ?? null)), 
    isLoading: isLoading$,
    isSaving: this.isSaving$.asObservable(),
    eventId: this.eventId$.pipe(map(id => id ?? null)) 
}).pipe(
    shareReplay(1) 
);
    }
    private patchForm(event: Event): void {
        console.log('✅ Patching form with event data:', event);
        const eventDate = new Date(event.date);
        const timeString = format(eventDate, 'HH:mm');
        this.eventForm.patchValue({
            title: event.name,
            description: event.description,
            date: eventDate, 
            time: timeString,
            location: event.location,
            capacity: event.capacity,
            visibility: event.visibility
        });
    }

    onSubmit(eventId: string | null): void {
        this.eventForm.markAllAsTouched(); 
        if (this.eventForm.invalid || !eventId) {
            console.log('⚠️ Form is invalid or Event ID missing');
             if (this.eventForm.hasError('dateInPast')) {
                this.showError('Event date cannot be in the past.');
             }
            return;
        }

        console.log('🔄 Updating event...', this.eventForm.value);
        this.isSaving$.next(true); 

        const updateDto: Partial<CreateEventDto> = {
            title: this.eventForm.value.title,
            description: this.eventForm.value.description,
            date: this.eventForm.value.date, 
            time: this.eventForm.value.time,
            location: this.eventForm.value.location,
            capacity: this.eventForm.value.capacity,
            visibility: this.eventForm.value.visibility
        };

        this.eventService.updateEvent(eventId, updateDto).subscribe({
            next: (updatedEvent) => {
                this.isSaving$.next(false); 
                if (updatedEvent) {
                    console.log('✅ Event updated successfully:', updatedEvent);
                    this.showSuccess('Event updated successfully!');
                    this.router.navigate(['/events', eventId]); 
                } else {
                    console.error('❌ Update returned null');
                    this.showError('Failed to update event');
                }
            },
            error: (error) => {
                this.isSaving$.next(false); 
                console.error('❌ Error updating event:', error);
                this.showError('An error occurred during update');
            }
        });
    }

    onCancel(eventId: string | null): void {
        if (eventId) {
            this.router.navigate(['/events', eventId]);
        } else {
            this.router.navigate(['/events']);
        }
    }

    private dateNotInPastValidator(group: FormGroup): { [key: string]: boolean } | null {
        const dateControl = group.get('date');
        const timeControl = group.get('time');
        const date = dateControl?.value;
        const time = timeControl?.value;

        if (!date || !time || !dateControl?.valid || !timeControl?.valid) {
            return null; 
        }

        try {
            const [hours, minutes] = time.split(':').map(Number);
            const selectedDateTime = new Date(date.getTime());
            selectedDateTime.setHours(hours, minutes, 0, 0);

            const now = new Date();
            now.setMilliseconds(0);
            selectedDateTime.setMilliseconds(0);


            if (selectedDateTime.getTime() < now.getTime()) {
                return { dateInPast: true };
            }
        } catch(e) {
            console.error("Error in date validator", e);
             return { invalidDateTime: true }; 
        }

        return null;
    }

    hasError(fieldName: string, errorType: string): boolean {
        const field = this.eventForm.get(fieldName);
        return !!(field?.hasError(errorType) && (field?.touched || field?.dirty));
    }

     get formHasDateError(): boolean {
         return !!(this.eventForm.hasError('dateInPast') &&
                   (this.eventForm.get('date')?.touched || this.eventForm.get('date')?.dirty) &&
                   (this.eventForm.get('time')?.touched || this.eventForm.get('time')?.dirty));
     }

    private showSuccess(message: string): void { 
        this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
    }
    private showError(message: string): void {
        this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
     private showErrorAndNavigate(message: string): void {
         this.showError(message);
         this.router.navigate(['/events']);
     }
}