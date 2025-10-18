import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncPipe, NgFor, NgIf } from '@angular/common'; // Import NgIf

// Services and Interfaces
import { Event, EventService } from '../../../../core/services/event.service';

// Child Components
import { EventCardComponent } from '../../components/event-card/event-card.component';

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // 1. Import the spinner module

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    NgFor,
    AsyncPipe,
    NgIf, // Add NgIf for *ngIf directives
    EventCardComponent,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule // 2. Add the spinner module here
  ],
  templateUrl: './events-list.component.html',
  styleUrl: './events-list.component.scss'
})
export class EventsListComponent implements OnInit {
  private eventService = inject(EventService);

  events$!: Observable<Event[]>;
  isLoading = true; // Flag for spinner

  ngOnInit(): void {
    this.events$ = this.eventService.getEvents();
    // Basic loading flag handling (can be improved later)
    this.events$.subscribe({
        next: () => this.isLoading = false,
        error: () => this.isLoading = false // Also stop loading on error
    });
  }
}