import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common'; // Import AsyncPipe and NgIf
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    NgIf,       // Add NgIf
    AsyncPipe,  // Add AsyncPipe
    MatToolbarModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Inject AuthService
  private authService = inject(AuthService);

  // Get signals from the service
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;

  // Logout method
  logout(): void {
    this.authService.logout();
  }
}