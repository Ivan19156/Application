import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ParticipationService } from './participation.service';

export interface User { id: string; name: string; email: string; }
export interface AuthResponse { token: string; user: User; }

interface RegisterUserDto { name: string; email: string; password: string; }
interface LoginRequestDto { email: string; password: string; }

const AUTH_USER_KEY = 'auth_user';
const AUTH_TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private participationService = inject(ParticipationService);
    private apiUrl = environment.apiUrl;

    currentUser = signal<User | null>(this.getUserFromStorage());
    isAuthenticated = signal<boolean>(!!this.getTokenFromStorage());

    constructor() {
      
      if (this.isAuthenticated()) {
        console.log('🔄 User already authenticated, loading participations...');
        this.participationService.loadInitialParticipations();
      }
    }

    login(credentials: LoginRequestDto): Observable<AuthResponse> {
        console.log('🔐 AuthService: Sending login request...');
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
            tap(response => {
                this.setAuthState(response);
                console.log('✅ Login successful, loading participations...');
                this.participationService.loadInitialParticipations();
            }),
            catchError(this.handleAuthError)
        );
    }

    register(userData: RegisterUserDto): Observable<User> {
        console.log('📝 AuthService: Sending register request...');
        return this.http.post<User>(`${this.apiUrl}/auth/register`, userData).pipe(
            tap(() => console.log('✅ Registration successful')),
            catchError(this.handleAuthError)
        );
    }

    logout(): void {
        console.log('🚪 AuthService: Logging out...');
       
        this.participationService.clearParticipations();
        
        
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        
        
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
        
        this.router.navigate(['/auth/login']);
        
        console.log('✅ Logout complete');
    }

    getToken(): string | null {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    
    getCurrentUserId(): string | null {
      return this.currentUser()?.id ?? null;
    }

    private setAuthState(response: AuthResponse): void {
        if (!response?.token || !response?.user) {
            console.error("❌ Invalid auth response received:", response);
            return;
        }
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        console.log('✅ Auth state updated');
    }

    private getUserFromStorage(): User | null {
        if (typeof localStorage === 'undefined') return null;
        
        const userJson = localStorage.getItem(AUTH_USER_KEY);
        if (!userJson) return null;
        
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error("❌ Error parsing user from localStorage", e);
            return null;
        }
    }

    private getTokenFromStorage(): string | null {
        return (typeof localStorage !== 'undefined') 
          ? localStorage.getItem(AUTH_TOKEN_KEY) 
          : null;
    }

    private handleAuthError(error: HttpErrorResponse): Observable<never> {
        console.error('❌ AuthService API Error:', error);
        let errorMessage = 'An unknown error occurred.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Invalid credentials.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid input. Please check the form.';
        } else if (error.status === 0) {
          errorMessage = 'Could not connect to the server.';
        }
        
        return throwError(() => ({ message: errorMessage, status: error.status }));
    }
}