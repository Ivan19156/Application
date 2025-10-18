// src/app/features/auth/auth.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  // Якщо користувач перейде просто на /auth, перенаправимо його на /auth/login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];