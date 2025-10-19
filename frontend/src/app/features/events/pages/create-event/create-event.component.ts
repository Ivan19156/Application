import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common'; 
import { BehaviorSubject, Observable, combineLatest, EMPTY } from 'rxjs'; 
import { catchError, tap } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; 
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 

import { EventService } from '../../../../core/services/event.service';

interface CreateEventViewModel {
  isSaving: boolean;
}

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    AsyncPipe,
    NgIf,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMaterialTimepickerModule,
    MatSnackBarModule
  ],
  templateUrl: './create-event.component.html',
  styleUrl: './create-event.component.scss'
})
export class CreateEventComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  eventForm!: FormGroup; 
  minDate = new Date();

  private isSaving$ = new BehaviorSubject<boolean>(false);
  vm$!: Observable<CreateEventViewModel>;

  ngOnInit(): void {
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

    this.vm$ = combineLatest({
      isSaving: this.isSaving$.asObservable()
    });
  }

  onSubmit(): void {
    this.eventForm.markAllAsTouched(); 
    if (this.eventForm.invalid) {
      console.log('⚠️ Form is invalid.');
       if (this.eventForm.hasError('dateInPast')) {
          this.showError('Event date cannot be in the past.');
       }
      return;
    }

    console.log('Submitting form... Data:', this.eventForm.value);
    this.isSaving$.next(true); 

    this.eventService.createEvent(this.eventForm.value).pipe(
      tap(createdEvent => {
        console.log('%c✅ Event Created Successfully!', 'color: green; font-weight: bold;', createdEvent);
        this.showSuccess('Event created successfully!');
        this.router.navigate(['/events', createdEvent.id]);
      }),
      catchError(err => {
        console.error('❌ Event Creation Failed:', err);
        this.showError(err?.message || 'Failed to create event.');
        return EMPTY;
      }),
      tap({ complete: () => this.isSaving$.next(false), error: () => this.isSaving$.next(false) })
    ).subscribe(); 
  }

  onCancel(): void {
    this.router.navigate(['/events']);
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
            now.setSeconds(0,0); 
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