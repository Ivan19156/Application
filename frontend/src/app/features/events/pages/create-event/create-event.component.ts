import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common'; // Import AsyncPipe and NgIf
import { BehaviorSubject, Observable, combineLatest, EMPTY } from 'rxjs'; // Import necessary RxJS operators
import { catchError, tap } from 'rxjs/operators';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; // For native Date
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import SnackBar

// Services
import { EventService } from '../../../../core/services/event.service';

// ViewModel Interface
interface CreateEventViewModel {
  isSaving: boolean;
}

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    AsyncPipe, // Add AsyncPipe
    NgIf,      // Add NgIf for error messages
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMaterialTimepickerModule,
    MatSnackBarModule // Add SnackBarModule
  ],
  templateUrl: './create-event.component.html',
  styleUrl: './create-event.component.scss'
})
export class CreateEventComponent implements OnInit {
  // --- Injections ---
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar); // Inject SnackBar

  // --- Form ---
  eventForm!: FormGroup; // Initialize in ngOnInit
  minDate = new Date();

  // --- State ---
  private isSaving$ = new BehaviorSubject<boolean>(false);
  vm$!: Observable<CreateEventViewModel>;

  ngOnInit(): void {
    // Initialize form
    this.eventForm = this.fb.group({
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

    // Create ViewModel
    this.vm$ = combineLatest({
      isSaving: this.isSaving$.asObservable()
    });
  }

  // --- Actions ---
  onSubmit(): void {
    this.eventForm.markAllAsTouched(); // Show validation errors
    if (this.eventForm.invalid) {
      console.log('⚠️ Form is invalid.');
       if (this.eventForm.hasError('dateInPast')) {
          this.showError('Event date cannot be in the past.');
       }
      return;
    }

    console.log('Submitting form... Data:', this.eventForm.value);
    this.isSaving$.next(true); // Indicate saving started

    // Use subscribe for the action
    this.eventService.createEvent(this.eventForm.value).pipe(
      tap(createdEvent => {
        // Side effect on success
        console.log('%c✅ Event Created Successfully!', 'color: green; font-weight: bold;', createdEvent);
        this.showSuccess('Event created successfully!');
        this.router.navigate(['/events', createdEvent.id]);
      }),
      catchError(err => {
        // Side effect on error
        console.error('❌ Event Creation Failed:', err);
        this.showError(err?.message || 'Failed to create event.');
        return EMPTY; // Complete the stream after error handling
      }),
      // Finalize is called on completion or error
      tap({ complete: () => this.isSaving$.next(false), error: () => this.isSaving$.next(false) })
      // Or use finalize operator: finalize(() => this.isSaving$.next(false))
    ).subscribe(); // Subscribe to trigger the action
  }

  onCancel(): void {
    this.router.navigate(['/events']);
  }

  // --- Validators & Helpers ---
  private dateNotInPastValidator(group: FormGroup): { [key: string]: boolean } | null {
      // ... (validator logic remains the same) ...
        const dateControl = group.get('date');
        const timeControl = group.get('time');
        const date = dateControl?.value;
        const time = timeControl?.value;

        if (!date || !time || !dateControl?.valid || !timeControl?.valid) {
            return null; // Don't validate if date/time are missing or individually invalid
        }
         try {
            const [hours, minutes] = time.split(':').map(Number);
            const selectedDateTime = new Date(date.getTime());
            selectedDateTime.setHours(hours, minutes, 0, 0);
            const now = new Date();
            now.setSeconds(0,0); // Compare up to minutes
            selectedDateTime.setSeconds(0,0);

            if (selectedDateTime < now) { return { dateInPast: true }; }
         } catch(e) { return { invalidDateTime: true }; }
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
}