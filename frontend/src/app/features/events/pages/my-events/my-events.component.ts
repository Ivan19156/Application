import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgIf, NgSwitch, NgSwitchCase, DatePipe } from '@angular/common';

import { EventService } from '../../../../core/services/event.service';
import { AiAssistantComponent } from '../../../ai/ai-assistant/ai-assistant.component';

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
    RouterModule,
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    CalendarMonthViewComponent,
    CalendarWeekViewComponent,
    AiAssistantComponent
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
  
  viewDate: Date = new Date(2025, 10, 17); 

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
            title: `${timeStr} ${event.name}`, 
            color: colors.purple,
            meta: {
              location: event.location,
              participants: event.participants,
              capacity: event.capacity,
              fullTitle: event.name 
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
    this.cdr.detectChanges();
  }

  eventClicked({ event }: { event: CalendarEvent }): void {
    console.log('🖱️ Event clicked:', event);
    this.router.navigate(['/events', event.id]);
  }

 
  previous(): void {
    const newDate = new Date(this.viewDate);
    
    if (this.view === CalendarView.Month) {
      newDate.setMonth(newDate.getMonth() - 1);
      console.log('⬅️ Previous month:', newDate);
    } else if (this.view === CalendarView.Week) {
      newDate.setDate(newDate.getDate() - 7);
      console.log('⬅️ Previous week:', newDate);
    }
    
    this.viewDate = newDate;
    this.cdr.detectChanges();
  }

  next(): void {
    const newDate = new Date(this.viewDate);
    
    if (this.view === CalendarView.Month) {
      newDate.setMonth(newDate.getMonth() + 1);
      console.log('➡️ Next month:', newDate);
    } else if (this.view === CalendarView.Week) {
      newDate.setDate(newDate.getDate() + 7);
      console.log('➡️ Next week:', newDate);
    }
    
    this.viewDate = newDate;
    this.cdr.detectChanges();
  }

  today(): void {
    this.viewDate = new Date();
    console.log('📍 Back to today:', this.viewDate);
    this.cdr.detectChanges();
  }

  getNavigationLabel(): string {
    if (this.view === CalendarView.Month) {
      return this.viewDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else if (this.view === CalendarView.Week) {
      const weekStart = this.getWeekStartForCalendar(this.viewDate);
      const weekEnd = this.getWeekEndForCalendar(this.viewDate);
      
      const startStr = weekStart.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const endStr = weekEnd.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      return `${startStr} - ${endStr}`;
    }
    
    return '';
  }

  private getWeekStartForCalendar(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day; 
    return new Date(d.setDate(diff));
  }

  private getWeekEndForCalendar(date: Date): Date {
    const weekStart = this.getWeekStartForCalendar(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); 
    return weekEnd;
  }
}