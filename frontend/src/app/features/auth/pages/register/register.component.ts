import { Component, inject, OnInit } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common'; 
import { BehaviorSubject, Observable, combineLatest, EMPTY } from 'rxjs'; 
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';

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
        AsyncPipe, 
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule
    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit { 
    
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);

    
    registerForm!: FormGroup; 

    private isLoading$ = new BehaviorSubject<boolean>(false);
    vm$!: Observable<RegisterViewModel>;

    ngOnInit(): void {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });

        this.vm$ = combineLatest({
            isLoading: this.isLoading$.asObservable()
        });
    }

onSubmit(): void {
    this.registerForm.markAllAsTouched();
    if (!this.registerForm.valid) {
        return;
    }

    this.isLoading$.next(true); 

    const registerData = this.registerForm.value; 

    this.authService.register(registerData).pipe(
        tap(response => {
            console.log('%c✅ Registration Successful!', 'color: green; font-weight: bold;', response);
            this.snackBar.open('Registration successful! Logging in...', 'Close', { duration: 2000 });
        }),
        switchMap(() => {
            console.log('Attempting auto-login after registration...');
            return this.authService.login({
                email: registerData.email,
                password: registerData.password
            }); 
        }),
        tap(loginResponse => {
            console.log('%c✅ Auto-Login Successful!', 'color: green; font-weight: bold;', loginResponse);
            this.router.navigate(['/events']); 
        }),
        catchError(err => {
            console.error('❌ Registration or Auto-Login Failed:', err);
            this.snackBar.open(err.message || 'An error occurred. Please try logging in manually.', 'Close', {
                duration: 4000,
                panelClass: ['error-snackbar']
            });
            
            if (!err.message?.toLowerCase().includes('register')) { 
                 this.router.navigate(['/auth/login']);
            }
            return EMPTY; 
        }),
        finalize(() => this.isLoading$.next(false))
    ).subscribe(); 
}

    hasError(controlName: string, errorName: string): boolean {
        const control = this.registerForm.get(controlName);
        return !!(control?.hasError(errorName) && (control?.touched || control?.dirty));
    }
}