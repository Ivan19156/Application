import { Component, inject, OnInit } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common'; 
import { BehaviorSubject, Observable, combineLatest, EMPTY } from 'rxjs'; 
import { catchError, finalize, tap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';


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
    AsyncPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit { 
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  
  loginForm!: FormGroup; 

 
  private isLoading$ = new BehaviorSubject<boolean>(false);
  vm$!: Observable<LoginViewModel>;

  ngOnInit(): void {
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    
    this.vm$ = combineLatest({
      isLoading: this.isLoading$.asObservable()
    });
  }

  
  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (!this.loginForm.valid) return;

    this.isLoading$.next(true); 

    this.authService.login(this.loginForm.value).pipe(
      tap(response => {
        console.log('%c✅ Login Successful!', 'color: green; font-weight: bold;', response);
        this.router.navigate(['/events']); 
      }),
      catchError(err => {
        console.error('❌ Login Failed:', err);
        this.snackBar.open(err.message || 'Login failed...', 'Close', { duration: 3000 });
        return EMPTY; 
      }),
      finalize(() => this.isLoading$.next(false)) 
    ).subscribe(); 
  }


  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control?.hasError(errorName) && (control?.touched || control?.dirty));
  }
}