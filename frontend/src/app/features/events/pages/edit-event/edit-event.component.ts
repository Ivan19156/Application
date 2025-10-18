// import { Component, OnInit, OnDestroy, inject } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { NgIf } from '@angular/common';
// import { Subscription } from 'rxjs';

// // Services
// import { EventService } from '../../../../core/services/event.service';

// // Angular Material
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatRadioModule } from '@angular/material/radio';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDatepickerModule } from '@angular/material/datepicker';
// import { MatNativeDateModule } from '@angular/material/core';
// import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// @Component({
//   selector: 'app-edit-event',
//   standalone: true,
//   imports: [
//     NgIf, 
//     ReactiveFormsModule, 
//     RouterModule,
//     MatCardModule, 
//     MatFormFieldModule, 
//     MatInputModule, 
//     MatButtonModule,
//     MatRadioModule, 
//     MatIconModule, 
//     MatDatepickerModule,
//     MatNativeDateModule, // Додали для нативного Date
//     NgxMaterialTimepickerModule,
//     MatProgressSpinnerModule, 
//     MatSnackBarModule
//   ],
//   templateUrl: './edit-event.component.html',
//   styleUrl: './edit-event.component.scss'
// })
// export class EditEventComponent implements OnInit, OnDestroy {
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private eventService = inject(EventService);
//   private snackBar = inject(MatSnackBar);

//   eventForm!: FormGroup;
//   isLoading = true;
//   eventId: string | null = null;
//   minDate = new Date(); // Мінімальна дата - сьогодні
  
//   private subscriptions = new Subscription(); // Для управління підписками

//   ngOnInit(): void {
//     this.eventId = this.route.snapshot.paramMap.get('id');
//     this.initializeForm();

//     if (this.eventId) {
//       this.loadEventData(this.eventId);
//     } else {
//       console.error('❌ Event ID not found!');
//       this.isLoading = false;
//       this.showError('Cannot load event: ID missing');
//       this.router.navigate(['/events']);
//     }
//   }

//   ngOnDestroy(): void {
//     // Відписуємося від всіх підписок
//     this.subscriptions.unsubscribe();
//   }

//   private initializeForm(): void {
//     this.eventForm = this.fb.group({
//       title: ['', [Validators.required, Validators.minLength(3)]],
//       description: [''],
//       date: [null, [Validators.required]],
//       time: ['', [Validators.required]],
//       location: ['', [Validators.required]],
//       capacity: [null, [Validators.min(1)]],
//       visibility: ['Public', [Validators.required]]
//     }, {
//       validators: this.dateNotInPastValidator // Custom validator
//     });
//   }

//   // Custom validator: перевірка що дата не в минулому
//   private dateNotInPastValidator(group: FormGroup): { [key: string]: boolean } | null {
//     const date = group.get('date')?.value;
//     const time = group.get('time')?.value;

//     if (!date || !time) {
//       return null;
//     }

//     const [hours, minutes] = time.split(':').map(Number);
//     const selectedDateTime = new Date(date);
//     selectedDateTime.setHours(hours, minutes, 0, 0);

//     const now = new Date();
    
//     if (selectedDateTime < now) {
//       return { dateInPast: true };
//     }

//     return null;
//   }

//   private loadEventData(id: string): void {
//     const sub = this.eventService.getEventById(id).subscribe({
//       next: (event) => {
//         if (event) {
//           console.log('✅ Event loaded for editing:', event);
          
//           // Конвертуємо Date в окремі поля для форми
//           const eventDate = new Date(event.date);
//           const timeString = this.formatTime(eventDate);

//           this.eventForm.patchValue({
//             title: event.name,
//             description: event.description,
//             date: eventDate, // Нативний Date для Material Datepicker
//             time: timeString, // "HH:mm" для timepicker
//             location: event.location,
//             capacity: event.capacity,
//             visibility: event.visibility
//           });
          
//           this.isLoading = false;
//         } else {
//           console.error('❌ Event not found for editing!');
//           this.isLoading = false;
//           this.showError('Event not found');
//           this.router.navigate(['/events']);
//         }
//       },
//       error: (error) => {
//         console.error('❌ Error loading event:', error);
//         this.isLoading = false;
//         this.showError('Failed to load event');
//         this.router.navigate(['/events']);
//       }
//     });

//     this.subscriptions.add(sub);
//   }

//   onSubmit(): void {
//     if (this.eventForm.invalid || !this.eventId) {
//       console.log('⚠️ Form is invalid or Event ID missing');
//       this.eventForm.markAllAsTouched();
//       return;
//     }

//     console.log('🔄 Updating event...', this.eventForm.value);
//     this.isLoading = true;

//     const sub = this.eventService.updateEvent(this.eventId, this.eventForm.value).subscribe({
//       next: (updatedEvent) => {
//         this.isLoading = false;
//         if (updatedEvent) {
//           console.log('✅ Event updated successfully:', updatedEvent);
//           this.showSuccess('Event updated successfully!');
//           this.router.navigate(['/events', this.eventId]);
//         } else {
//           console.error('❌ Update returned null');
//           this.showError('Failed to update event');
//         }
//       },
//       error: (error) => {
//         this.isLoading = false;
//         console.error('❌ Error updating event:', error);
//         this.showError('An error occurred during update');
//       }
//     });

//     this.subscriptions.add(sub);
//   }

//   onCancel(): void {
//     if (this.eventId) {
//       this.router.navigate(['/events', this.eventId]);
//     } else {
//       this.router.navigate(['/events']);
//     }
//   }

//   // Helper methods
//   hasError(fieldName: string, errorType: string): boolean {
//     const field = this.eventForm.get(fieldName);
//     return !!(field?.hasError(errorType) && field?.touched);
//   }

//   get isDateInPast(): boolean {
//     return !!(this.eventForm.hasError('dateInPast') && 
//               this.eventForm.get('date')?.touched && 
//               this.eventForm.get('time')?.touched);
//   }

//   private formatTime(date: Date): string {
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     return `${hours}:${minutes}`;
//   }

//   private showSuccess(message: string): void {
//     this.snackBar.open(message, 'Close', { 
//       duration: 3000,
//       horizontalPosition: 'end',
//       verticalPosition: 'top',
//       panelClass: ['success-snackbar']
//     });
//   }

//   private showError(message: string): void {
//     this.snackBar.open(message, 'Close', { 
//       duration: 5000,
//       horizontalPosition: 'end',
//       verticalPosition: 'top',
//       panelClass: ['error-snackbar']
//     });
//   }
// }


import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common'; // Use AsyncPipe
import { Observable, Subscription, BehaviorSubject, combineLatest, of, EMPTY, throwError } from 'rxjs';
import { map, switchMap, tap, catchError, shareReplay, startWith, filter, take } from 'rxjs/operators';
import { format } from 'date-fns'; // Use date-fns

// Services and Interfaces
import { Event, EventService, CreateEventDto } from '../../../../core/services/event.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; // For native Date object
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// View Model Interface
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
    // --- Injections ---
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private eventService = inject(EventService);
    private snackBar = inject(MatSnackBar);

    // --- Form ---
    // Initialize form structure immediately
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
    minDate = new Date(); // Min date for datepicker

    // --- State Observables ---
    private eventId$: Observable<string | null> = this.route.paramMap.pipe(
        map(params => params.get('id')),
        shareReplay(1) // Cache the ID
    );

    private isSaving$ = new BehaviorSubject<boolean>(false); // Subject to manage saving state

    // --- ViewModel Observable ---
    vm$!: Observable<EditEventViewModel>;

    ngOnInit(): void {
        // Fetch event data based on ID
        const eventData$ = this.eventId$.pipe(
            switchMap(id => {
                if (!id) {
                    this.showErrorAndNavigate('Event ID missing');
                    return of(null); // Return null if no ID
                }
                return this.eventService.getEventById(id).pipe(
                    tap(event => { // Patch form when data arrives
                        if (event) {
                            this.patchForm(event);
                        } else {
                            this.showErrorAndNavigate('Event not found');
                        }
                    }),
                    catchError(error => {
                        console.error('Error loading event:', error);
                        this.showErrorAndNavigate('Failed to load event');
                        return of(null); // Return null on error
                    })
                );
            }),
            shareReplay(1) // Cache the event data
        );

        // Loading state derived from eventData$
        const isLoading$ = eventData$.pipe(
            map(event => event === undefined), // Consider initial state or use startWith
            startWith(true) // Start as loading
        );

        // Combine all state into the ViewModel
        this.vm$ = combineLatest({
    // Ensure event type matches ViewModel (Event | null)
    event: eventData$.pipe(map(e => e ?? null)), // Map undefined to null
    isLoading: isLoading$,
    isSaving: this.isSaving$.asObservable(),
    // Ensure eventId type matches ViewModel (string | null)
    eventId: this.eventId$.pipe(map(id => id ?? null)) // Map undefined/null to null
}).pipe(
    // Optional: Log the final ViewModel for debugging
    // tap(vm => console.log('ViewModel:', vm))
    shareReplay(1) // Share the ViewModel observable result
);
    }

    // --- Form Handling ---
    private patchForm(event: Event): void {
        console.log('✅ Patching form with event data:', event);
        const eventDate = new Date(event.date);
        const timeString = format(eventDate, 'HH:mm'); // Use date-fns format

        this.eventForm.patchValue({
            title: event.name,
            description: event.description,
            date: eventDate, // Native Date object
            time: timeString, // "HH:mm" string
            location: event.location,
            capacity: event.capacity,
            visibility: event.visibility
        });
    }

    onSubmit(eventId: string | null): void {
        this.eventForm.markAllAsTouched(); // Show validation errors
        if (this.eventForm.invalid || !eventId) {
            console.log('⚠️ Form is invalid or Event ID missing');
            // Check for dateInPast error specifically
             if (this.eventForm.hasError('dateInPast')) {
                this.showError('Event date cannot be in the past.');
             }
            return;
        }

        console.log('🔄 Updating event...', this.eventForm.value);
        this.isSaving$.next(true); // Start saving indicator

        const updateDto: Partial<CreateEventDto> = {
            title: this.eventForm.value.title,
            description: this.eventForm.value.description,
            date: this.eventForm.value.date, // Already Date object
            time: this.eventForm.value.time, // Already "HH:mm" string
            location: this.eventForm.value.location,
            capacity: this.eventForm.value.capacity,
            visibility: this.eventForm.value.visibility
        };

        // Still need subscribe for the action
        this.eventService.updateEvent(eventId, updateDto).subscribe({
            next: (updatedEvent) => {
                this.isSaving$.next(false); // Stop saving indicator
                if (updatedEvent) {
                    console.log('✅ Event updated successfully:', updatedEvent);
                    this.showSuccess('Event updated successfully!');
                    this.router.navigate(['/events', eventId]); // Navigate back to details
                } else {
                    console.error('❌ Update returned null');
                    this.showError('Failed to update event');
                }
            },
            error: (error) => {
                this.isSaving$.next(false); // Stop saving indicator on error too
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

    // --- Validators ---
    private dateNotInPastValidator(group: FormGroup): { [key: string]: boolean } | null {
        const dateControl = group.get('date');
        const timeControl = group.get('time');
        const date = dateControl?.value;
        const time = timeControl?.value;

        if (!date || !time || !dateControl?.valid || !timeControl?.valid) {
            return null; // Don't validate if date/time are missing or individually invalid
        }

        try {
            const [hours, minutes] = time.split(':').map(Number);
            // Clone date before setting time to avoid modifying original form value directly
            const selectedDateTime = new Date(date.getTime());
            selectedDateTime.setHours(hours, minutes, 0, 0);

            const now = new Date();
            // Compare dates only, ignoring milliseconds for robustness
            now.setMilliseconds(0);
            selectedDateTime.setMilliseconds(0);


            if (selectedDateTime.getTime() < now.getTime()) {
                return { dateInPast: true };
            }
        } catch(e) {
            console.error("Error in date validator", e);
             return { invalidDateTime: true }; // Indicate generic date/time issue
        }

        return null;
    }

    // --- Helpers ---
    hasError(fieldName: string, errorType: string): boolean {
        const field = this.eventForm.get(fieldName);
        return !!(field?.hasError(errorType) && (field?.touched || field?.dirty));
    }

     get formHasDateError(): boolean {
         return !!(this.eventForm.hasError('dateInPast') &&
                   (this.eventForm.get('date')?.touched || this.eventForm.get('date')?.dirty) &&
                   (this.eventForm.get('time')?.touched || this.eventForm.get('time')?.dirty));
     }

    private showSuccess(message: string): void { /* ... SnackBar ... */
        this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
    }
    private showError(message: string): void { /* ... SnackBar ... */
        this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
     private showErrorAndNavigate(message: string): void {
         this.showError(message);
         this.router.navigate(['/events']);
     }
}