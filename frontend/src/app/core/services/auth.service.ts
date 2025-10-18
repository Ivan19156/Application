// import { Injectable, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, of, throwError } from 'rxjs';
// import { delay, tap } from 'rxjs/operators';

// // Описуємо, які дані ми очікуємо від бекенду
// export interface AuthResponse {
//   token: string;
//   user: {
//     id: string;
//     name: string;
//     email: string;
//   };
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private http = inject(HttpClient);

//   // --- МЕТОД ДЛЯ ЛОГІНУ ---
//   login(credentials: { email: string, password: string }): Observable<AuthResponse> {
//     console.log('AuthService: Logging in with', credentials);

//     // --- СИМУЛЯЦІЯ ВІДПОВІДІ ВІД СЕРВЕРА ---
//     if (credentials.email === 'test@test.com' && credentials.password === 'password123') {
//       // Якщо дані правильні, повертаємо фейкову успішну відповідь
//       const mockSuccessResponse: AuthResponse = {
//         token: 'fake-jwt-token-from-service-123',
//         user: { id: '1', name: 'Test User', email: 'test@test.com' }
//       };
//       // of() створює Observable, delay(1000) імітує затримку мережі в 1 секунду
//       return of(mockSuccessResponse).pipe(delay(1000));
//     } else {
//       // Якщо дані неправильні, повертаємо фейкову помилку
//       const mockErrorResponse = { status: 401, message: 'Invalid credentials' };
//       return throwError(() => mockErrorResponse).pipe(delay(1000));
//     }
//   }

//   // --- МЕТОД ДЛЯ РЕЄСТРАЦІЇ (поки що просто заглушка) ---
//   register(userData: any): Observable<any> {
//     console.log('AuthService: Registering user', userData);
//     // Тут буде реальний POST-запит на /api/auth/register
//     // Зараз просто імітуємо успіх
//     return of({ success: true, message: 'User registered successfully!' }).pipe(delay(1000));
//   }
// }


import { Injectable, inject, signal } from '@angular/core'; // Ensure 'signal' is imported
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}

// Keys for localStorage
const FAKE_USER_KEY = 'fake_auth_user';
const FAKE_TOKEN_KEY = 'fake_auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // --- Reactive State using Signals ---
  // Ensure these lines are exactly like this
  currentUser = signal<User | null>(this.getUserFromStorage());
  isAuthenticated = signal<boolean>(!!this.getTokenFromStorage()); // This is the signal

  // --- Login Method ---
  login(credentials: { email: string, password: string }): Observable<AuthResponse> {
    console.log('AuthService: Logging in with', credentials);
    // --- SIMULATION ---
    if (credentials.email === 'test@test.com' && credentials.password === 'password123') {
      const mockSuccessResponse: AuthResponse = {
        token: 'fake-jwt-token-from-service-123',
        user: { id: 'user1', name: 'Test User', email: 'test@test.com' }
      };
      return of(mockSuccessResponse).pipe(
        delay(1000),
        tap(response => this.setAuthState(response)) // Save state on success
      );
    } else {
      const mockErrorResponse = { status: 401, message: 'Invalid credentials' };
      return throwError(() => mockErrorResponse).pipe(delay(1000));
    }
  }

  // --- Register Method (Simulation) ---
  register(userData: any): Observable<any> {
    console.log('AuthService: Registering user', userData);
    // Add logic here later if needed, e.g., auto-login after register
    return of({ success: true, message: 'User registered successfully!' }).pipe(delay(1000));
  }

  // --- Logout Method ---
  logout(): void {
    console.log('AuthService: Logging out');
    localStorage.removeItem(FAKE_USER_KEY);
    localStorage.removeItem(FAKE_TOKEN_KEY);
    this.currentUser.set(null); // Update signals
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']); // Redirect
  }

  // --- Helper Methods ---
  private setAuthState(response: AuthResponse): void {
    localStorage.setItem(FAKE_USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(FAKE_TOKEN_KEY, response.token);
    this.currentUser.set(response.user); // Update signal
    this.isAuthenticated.set(true); // Update signal
    console.log('AuthService: State updated and saved');
  }

  private getUserFromStorage(): User | null {
    const userJson = typeof localStorage !== 'undefined' ? localStorage.getItem(FAKE_USER_KEY) : null;
    try {
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        console.error("Error parsing user from localStorage", e);
        localStorage.removeItem(FAKE_USER_KEY); // Clear corrupted data
        return null;
    }
  }

  private getTokenFromStorage(): string | null {
     return typeof localStorage !== 'undefined' ? localStorage.getItem(FAKE_TOKEN_KEY) : null;
  }

  getCurrentUserId(): string | null {
    return this.currentUser()?.id ?? null; // Call signal to get value
  }
}