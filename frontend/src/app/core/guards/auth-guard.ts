import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Import your AuthService

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check the authentication status using the signal
  if (authService.isAuthenticated()) {
    return true; // User is logged in, allow access
  } else {
    // User is not logged in, redirect to login page
    console.log('AuthGuard: User not authenticated, redirecting to login.');
    router.navigate(['/auth/login']);
    return false; // Block access to the originally requested route
  }
};