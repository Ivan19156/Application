import { Component, inject, OnInit } from '@angular/core'; // Add OnInit
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common'; // Import AsyncPipe
import { BehaviorSubject, Observable, combineLatest, EMPTY } from 'rxjs'; // Import RxJS
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';

// ViewModel Interface
interface RegisterViewModel {
    isLoading: boolean;
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        NgIf,
        AsyncPipe, // Add AsyncPipe
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule
    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit { // Implement OnInit
    // --- Injections ---
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);

    // --- Form ---
    registerForm!: FormGroup; // Initialize in ngOnInit

    // --- State ---
    private isLoading$ = new BehaviorSubject<boolean>(false);
    vm$!: Observable<RegisterViewModel>;

    ngOnInit(): void {
        // Initialize form
        this.registerForm = this.fb.group({
            name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });

        // Create ViewModel
        this.vm$ = combineLatest({
            isLoading: this.isLoading$.asObservable()
        });
    }

    // --- Action ---
    onSubmit(): void {
        this.registerForm.markAllAsTouched();
        if (!this.registerForm.valid) {
            return;
        }

        this.isLoading$.next(true); // Indicate loading started

        this.authService.register(this.registerForm.value).pipe(
            tap(response => {
                // Side effect on success
                console.log('%c✅ Registration Successful!', 'color: green; font-weight: bold;', response);
                this.snackBar.open(response.message || 'Registration successful!', 'Close', { duration: 3000 });
                this.router.navigate(['/events']); // Navigate on success
                // Consider auto-login here if needed
            }),
            catchError(err => {
                // Side effect on error
                console.error('❌ Registration Failed:', err);
                this.snackBar.open(err.message || 'Registration failed. Please try again.', 'Close', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                });
                return EMPTY; // Complete stream after error
            }),
            finalize(() => this.isLoading$.next(false)) // Ensure loading state resets
        ).subscribe(); // Subscribe to trigger the action
    }

    // --- Helpers ---
     hasError(controlName: string, errorName: string): boolean {
        const control = this.registerForm.get(controlName);
        return !!(control?.hasError(errorName) && (control?.touched || control?.dirty));
    }
}