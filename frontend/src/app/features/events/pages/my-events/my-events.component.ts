import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgIf, NgSwitch, NgSwitchCase, DatePipe } from '@angular/common';

import { EventService } from '../../../../core/services/event.service';

import { 
  CalendarEvent, 
  CalendarView, 
  CalendarMonthViewComponent, 
  CalendarWeekViewComponent 
} from 'angular-calendar';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const colors: any = {
  purple: {
    primary: '#7c3aed',
    secondary: '#e9d5ff'
  }
};

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [
    NgIf, 
    NgSwitch, 
    NgSwitchCase,
    DatePipe,
    RouterModule, // 👈 Для routerLink в template
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    CalendarMonthViewComponent,
    CalendarWeekViewComponent,
  ],
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyEventsComponent implements OnInit, OnDestroy {
  private eventService = inject(EventService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  
  // Встановлюємо viewDate на листопад 2025
  viewDate: Date = new Date(2025, 10, 17); // 17 листопада 2025

  events: CalendarEvent[] = [];
  isLoading = true;
  private eventsSubscription: Subscription | null = null;

  ngOnInit(): void {
    console.log('🚀 MyEventsComponent initialized');
    console.log('📅 Current viewDate:', this.viewDate);
    this.fetchEvents();
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
  }

  fetchEvents(): void {
    this.isLoading = true;
    console.log('🔄 Fetching events...');
    
    this.eventsSubscription = this.eventService.getMyEvents().pipe(
      map(events => {
        console.log('📦 Received events from service:', events);
        
        const calendarEvents = events.map(event => {
          console.log('🎯 Mapping event:', event.name, 'Date:', event.date);
          
          const eventDate = new Date(event.date);
          const timeStr = eventDate.toLocaleTimeString('uk-UA', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          
          return {
            id: event.id,
            start: eventDate,
            title: `${timeStr} ${event.name}`, // Додаємо час до назви
            color: colors.purple,
            meta: {
              location: event.location,
              participants: event.participants,
              capacity: event.capacity,
              fullTitle: event.name // Зберігаємо повну назву для tooltip
            }
          };
        });
        
        console.log('✅ Mapped calendar events:', calendarEvents);
        return calendarEvents;
      })
    ).subscribe({
      next: (calendarEvents) => {
        console.log('✅ Events loaded successfully:', calendarEvents.length);
        this.events = calendarEvents;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading events:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setView(view: CalendarView): void {
    console.log('👁️ Switching view to:', view);
    this.view = view;
  }

  eventClicked({ event }: { event: CalendarEvent }): void {
    console.log('🖱️ Event clicked:', event);
    this.router.navigate(['/events', event.id]);
  }

  // Навігація по календарю
  previousMonth(): void {
    const newDate = new Date(this.viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.viewDate = newDate;
    console.log('⬅️ Previous month:', this.viewDate);
  }

  nextMonth(): void {
    const newDate = new Date(this.viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.viewDate = newDate;
    console.log('➡️ Next month:', this.viewDate);
  }

  today(): void {
    this.viewDate = new Date();
    console.log('📍 Back to today:', this.viewDate);
  }
}

