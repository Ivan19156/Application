import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root'
})
export class ParticipationService {
  private eventService = inject(EventService);
  private joinedEventIds$ = new BehaviorSubject<string[]>([]);
  private initialized = false;

  constructor() {
  }

  loadInitialParticipations(): void {
    if (this.initialized) {
      console.log('⚠️ Participations already loaded, skipping...');
      return;
    }
    
    this.initialized = true;
    console.log('🔄 Loading initial participations...');

    this.eventService.getMyEvents().pipe(
      tap(events => {
        const eventIds = events.map(e => e.id);
        console.log('✅ Loaded joined events:', eventIds);
        this.joinedEventIds$.next(eventIds);
      }),
      catchError(error => {
        console.error('❌ Failed to load joined events:', error);
        this.initialized = false;
        return of([]);
      })
    ).subscribe();
  }

  clearParticipations(): void {
    console.log('🗑️ Clearing joined events cache');
    this.joinedEventIds$.next([]);
    this.initialized = false;
  }

  isJoined(eventId: string): Observable<boolean> {
    return this.joinedEventIds$.asObservable().pipe(
      map(ids => ids.includes(eventId))
    );
  }

  joinEvent(eventId: string): Observable<{ success: boolean; message?: string }> {
    return this.eventService.joinEvent(eventId).pipe(
      tap(response => {
        if (response.success) {
          const currentIds = this.joinedEventIds$.getValue();
          if (!currentIds.includes(eventId)) {
            this.joinedEventIds$.next([...currentIds, eventId]);
            console.log('✅ Joined event:', eventId);
          }
        }
      }),
      catchError(error => {
        console.error("❌ ParticipationService: Error joining event", error);
        return throwError(() => error);
      })
    );
  }

  leaveEvent(eventId: string): Observable<{ success: boolean; message?: string }> {
    return this.eventService.leaveEvent(eventId).pipe(
      tap(response => {
        if (response.success) {
          const currentIds = this.joinedEventIds$.getValue();
          this.joinedEventIds$.next(currentIds.filter(id => id !== eventId));
          console.log('✅ Left event:', eventId);
        }
      }),
      catchError(error => {
        console.error("❌ ParticipationService: Error leaving event", error);
        return throwError(() => error);
      })
    );
  }
}