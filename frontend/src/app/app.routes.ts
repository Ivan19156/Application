import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth-guard'; 

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'events/new',
    loadComponent: () => import('./features/events/pages/create-event/create-event.component').then(m => m.CreateEventComponent),
    canActivate: [authGuard] },
  {
    path: 'events/:id',
    loadComponent: () => import('./features/events/pages/event-details/event-details.component').then(m => m.EventDetailsComponent),
    canActivate: [authGuard] 
  },
  {
    path: 'events/:id/edit',
    loadComponent: () => import('./features/events/pages/edit-event/edit-event.component').then(m => m.EditEventComponent),
    canActivate: [authGuard] 
  },
  {
    path: '', 
    component: MainLayoutComponent,
    canActivate: [authGuard], 
    children: [
      {
        path: 'events', 
        loadComponent: () => import('./features/events/pages/events-list/events-list.component').then(m => m.EventsListComponent)
      },
      {
        path: 'my-events',
        loadComponent: () => import('./features/events/pages/my-events/my-events.component').then(m => m.MyEventsComponent)
      },
      {
        path: '', 
        redirectTo: 'events',
        pathMatch: 'full'
      }
    ]
  },
  
];