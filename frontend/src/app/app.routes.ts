import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth-guard'; // Import the guard

export const routes: Routes = [
  // --- Public Routes (No Layout, No Guard) ---
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // --- Protected Standalone Routes (No Layout, WITH Guard) ---
  {
    path: 'events/new',
    loadComponent: () => import('./features/events/pages/create-event/create-event.component').then(m => m.CreateEventComponent),
    canActivate: [authGuard] // Protect this route
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./features/events/pages/event-details/event-details.component').then(m => m.EventDetailsComponent),
    canActivate: [authGuard] // Protect this route
  },
  {
    path: 'events/:id/edit',
    loadComponent: () => import('./features/events/pages/edit-event/edit-event.component').then(m => m.EditEventComponent),
    canActivate: [authGuard] // Protect this route
  },

  // --- Protected Routes within Main Layout (WITH Header/Footer, WITH Guard) ---
  {
    path: '', // Base path for main layout
    component: MainLayoutComponent,
    canActivate: [authGuard], // Protect the layout and all its children
    children: [
      {
        path: 'events', // Events list page
        loadComponent: () => import('./features/events/pages/events-list/events-list.component').then(m => m.EventsListComponent)
      },
      {
        path: 'my-events', // "My Events" page
        loadComponent: () => import('./features/events/pages/my-events/my-events.component').then(m => m.MyEventsComponent)
      },
      {
        path: '', // Default redirect within the layout
        redirectTo: 'events',
        pathMatch: 'full'
      }
      // Add other main layout routes here later
    ]
  },

  // --- Fallback Route (Optional) ---
  // { path: '**', redirectTo: '/events' } // Redirect any unknown path
];