// import { Component, inject, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { AsyncPipe, NgIf } from '@angular/common'; 
// import { BehaviorSubject, Observable, combineLatest, EMPTY } from 'rxjs'; 
// import { catchError, tap } from 'rxjs/operators';

// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatRadioModule } from '@angular/material/radio';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDatepickerModule } from '@angular/material/datepicker';
// import { MatNativeDateModule } from '@angular/material/core'; 
// import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 

// import { EventService } from '../../../../core/services/event.service';

// interface CreateEventViewModel {
//   isSaving: boolean;
// }

// @Component({
//   selector: 'app-create-event',
//   standalone: true,
//   imports: [
//     ReactiveFormsModule,
//     RouterModule,
//     AsyncPipe,
//     NgIf,
//     MatCardModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatButtonModule,
//     MatRadioModule,
//     MatIconModule,
//     MatDatepickerModule,
//     MatNativeDateModule,
//     NgxMaterialTimepickerModule,
//     MatSnackBarModule
//   ],
//   templateUrl: './create-event.component.html',
//   styleUrl: './create-event.component.scss'
// })
// export class CreateEventComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private eventService = inject(EventService);
//   private router = inject(Router);
//   private snackBar = inject(MatSnackBar);

//   eventForm!: FormGroup; 
//   minDate = new Date();

//   private isSaving$ = new BehaviorSubject<boolean>(false);
//   vm$!: Observable<CreateEventViewModel>;

//   ngOnInit(): void {
//     this.eventForm = this.fb.group({
//       title: ['', [Validators.required, Validators.minLength(3)]],
//       description: [''],
//       date: [null, [Validators.required]],
//       time: ['', [Validators.required]],
//       location: ['', [Validators.required]],
//       capacity: [null, [Validators.min(1)]],
//       visibility: ['Public', [Validators.required]]
//     }, {
//       validators: this.dateNotInPastValidator
//     });

//     this.vm$ = combineLatest({
//       isSaving: this.isSaving$.asObservable()
//     });
//   }

//   onSubmit(): void {
//     this.eventForm.markAllAsTouched(); 
//     if (this.eventForm.invalid) {
//       console.log('⚠️ Form is invalid.');
//        if (this.eventForm.hasError('dateInPast')) {
//           this.showError('Event date cannot be in the past.');
//        }
//       return;
//     }

//     console.log('Submitting form... Data:', this.eventForm.value);
//     this.isSaving$.next(true); 

//     this.eventService.createEvent(this.eventForm.value).pipe(
//       tap(createdEvent => {
//         console.log('%c✅ Event Created Successfully!', 'color: green; font-weight: bold;', createdEvent);
//         this.showSuccess('Event created successfully!');
//         this.router.navigate(['/events', createdEvent.id]);
//       }),
//       catchError(err => {
//         console.error('❌ Event Creation Failed:', err);
//         this.showError(err?.message || 'Failed to create event.');
//         return EMPTY;
//       }),
//       tap({ complete: () => this.isSaving$.next(false), error: () => this.isSaving$.next(false) })
//     ).subscribe(); 
//   }

//   onCancel(): void {
//     this.router.navigate(['/events']);
//   }

//   private dateNotInPastValidator(group: FormGroup): { [key: string]: boolean } | null {
//         const dateControl = group.get('date');
//         const timeControl = group.get('time');
//         const date = dateControl?.value;
//         const time = timeControl?.value;

//         if (!date || !time || !dateControl?.valid || !timeControl?.valid) {
//             return null; 
//         }
//          try {
//             const [hours, minutes] = time.split(':').map(Number);
//             const selectedDateTime = new Date(date.getTime());
//             selectedDateTime.setHours(hours, minutes, 0, 0);
//             const now = new Date();
//             now.setSeconds(0,0); 
//             selectedDateTime.setSeconds(0,0);

//             if (selectedDateTime < now) { return { dateInPast: true }; }
//          } catch(e) { return { invalidDateTime: true }; }
//         return null;
//   }

//   hasError(fieldName: string, errorType: string): boolean {
//     const field = this.eventForm.get(fieldName);
//     return !!(field?.hasError(errorType) && (field?.touched || field?.dirty));
//   }

//    get formHasDateError(): boolean {
//      return !!(this.eventForm.hasError('dateInPast') &&
//                (this.eventForm.get('date')?.touched || this.eventForm.get('date')?.dirty) &&
//                (this.eventForm.get('time')?.touched || this.eventForm.get('time')?.dirty));
//    }

//   private showSuccess(message: string): void {
//       this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
//   }
//   private showError(message: string): void {
//       this.snackBar.open(message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
//   }
// }


import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { BehaviorSubject, Observable, EMPTY } from 'rxjs';
import { catchError, finalize, map, startWith, tap } from 'rxjs/operators';
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
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips'; // 👈 Імпорт для "чіпсів"
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'; // 👈 Імпорт для автодоповнення
import { LiveAnnouncer } from '@angular/cdk/a11y';

// Services
import { EventService, CreateEventDto as BaseCreateEventDto } from '../../../../core/services/event.service';

// TODO: Move this to the service file once the backend is updated
export interface CreateEventDto extends BaseCreateEventDto {
  tags: string[];
}

interface CreateEventViewModel { isSaving: boolean; }

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterModule, AsyncPipe, NgIf, NgFor,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatRadioModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
    NgxMaterialTimepickerModule, MatSnackBarModule,
    MatChipsModule, // 👈 Додаємо
    MatAutocompleteModule // 👈 Додаємо
  ],
  templateUrl: './create-event.component.html',
  styleUrl: './create-event.component.scss'
})
export class CreateEventComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  announcer = inject(LiveAnnouncer);

  eventForm!: FormGroup;
  minDate = new Date();
  
  // --- Логіка для тегів ---
  tags: string[] = [];
  tagCtrl = new FormControl('');
  allTags: string[] = ['Tech', 'Meetup', 'Workshop', 'Conference', 'Art', 'Music', 'Sports', 'Food']; // 👈 Мок-дані для автодоповнення
  filteredTags: Observable<string[]>;
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;
  // -------------------------

  private isSaving$ = new BehaviorSubject<boolean>(false);
  vm$!: Observable<CreateEventViewModel>;

  constructor() {
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags.slice())),
    );
  }

  ngOnInit(): void {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      date: [null, [Validators.required]],
      time: ['', [Validators.required]],
      location: ['', [Validators.required]],
      capacity: [null, [Validators.min(1)]],
      visibility: ['Public', [Validators.required]],
    });

    this.vm$ = this.isSaving$.asObservable().pipe(map(isSaving => ({ isSaving })));
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && this.tags.length < 5 && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
      this.announcer.announce(`Removed ${tag}`);
    }
  }

  selectedTag(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (this.tags.length < 5 && !this.tags.includes(value)) {
        this.tags.push(value);
    }
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag => tag.toLowerCase().includes(filterValue));
  }
  
  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      this.showError("Please fill all required fields correctly.");
      return;
    }

    this.isSaving$.next(true);

    const formValue = this.eventForm.value;
    const createDto: CreateEventDto = {
      title: formValue.title,
      description: formValue.description,
      date: formValue.date,
      time: formValue.time,
      location: formValue.location,
      capacity: formValue.capacity,
      visibility: formValue.visibility,
      tags: this.tags // 👈 Додаємо наш масив тегів
    };

    this.eventService.createEvent(createDto).pipe(
      tap(createdEvent => {
        this.showSuccess('Event created successfully!');
        this.router.navigate(['/events', createdEvent.id]);
      }),
      catchError(err => {
        this.showError(err?.message || 'Failed to create event.');
        return EMPTY;
      }),
      finalize(() => this.isSaving$.next(false))
    ).subscribe();
  }

  onCancel(): void { this.router.navigate(['/events']); }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.touched || field?.dirty));
  }

  get formHasDateError(): boolean { 
      const form = this.eventForm;
      return !!(form.hasError('dateInPast') && (form.get('date')?.touched || form.get('time')?.touched));
  }
  
  private showSuccess(message: string): void { this.snackBar.open(message, 'Close', { duration: 3000 }); }
  private showError(message: string): void { this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['error-snackbar'] }); }
}

