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
interface LoginViewModel {
  isLoading: boolean;
}

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit { // Implement OnInit
  // --- Injections ---
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // --- Form ---
  loginForm!: FormGroup; // Initialize in ngOnInit

  // --- State ---
  private isLoading$ = new BehaviorSubject<boolean>(false);
  vm$!: Observable<LoginViewModel>;

  ngOnInit(): void {
    // Initialize form
    this.loginForm = this.fb.group({
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
    this.loginForm.markAllAsTouched();
    if (!this.loginForm.valid) return;

    this.isLoading$.next(true); // Indicate loading started

    this.authService.login(this.loginForm.value).pipe(
      tap(response => {
        // Side effect on success
        console.log('%c✅ Login Successful!', 'color: green; font-weight: bold;', response);
        this.router.navigate(['/events']); // Navigate on success
      }),
      catchError(err => {
        // Side effect on error
        console.error('❌ Login Failed:', err);
        this.snackBar.open(err.message || 'Login failed...', 'Close', { duration: 3000 });
        return EMPTY; // Complete stream after error
      }),
      finalize(() => this.isLoading$.next(false)) // Ensure loading state resets
    ).subscribe(); // Subscribe to trigger the action
  }

  // --- Helpers ---
  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control?.hasError(errorName) && (control?.touched || control?.dirty));
  }
}