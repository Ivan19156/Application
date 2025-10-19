import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface EventSummaryDto {
  id: string;
  name: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number | null;
  participantCount: number;
}

interface EventDetailsDto {
  id: string;
  name: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number | null;
  visibility: string;
  organizerId: string;
  organizerName: string;
  participantNames: string[];
  participantCount: number;
}

export interface CreateEventDto {
  title: string;
  description: string;
  date: Date | null;
  time: string | null;
  location: string;
  capacity: number | null;
  visibility: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  date?: Date | null;
  time?: string | null;
  location?: string;
  capacity?: number | null;
  visibility?: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  capacity: number | null;
  participants: number;
  participantNames: string[];
  visibility: 'Public' | 'Private';
  organizerId: string;
}

export interface PaginatedEvents {
  events: Event[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/events`;

  getEvents(searchTerm: string, page: number, pageSize: number): Observable<PaginatedEvents> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
      
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => ({
        ...response,
        events: response.events.map((dto: EventSummaryDto) => this.mapSummaryToEvent(dto)),
      })),
      catchError(this.handleError)
    );
  }

  getEventById(id: string): Observable<Event | undefined> {
    return this.http.get<EventDetailsDto>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.mapDetailsToEvent(dto)),
      catchError(error => {
        if (error.status === 404) return of(undefined);
        return this.handleError(error);
      })
    );
  }

  getMyEvents(): Observable<Event[]> {
    return this.http.get<EventSummaryDto[]>(`${environment.apiUrl}/users/me/events`).pipe(
      map(dtos => dtos.map(dto => this.mapSummaryToEvent(dto))),
      catchError(this.handleError)
    );
  }

  createEvent(dto: CreateEventDto): Observable<Event> {
    const payload = this.prepareCreatePayload(dto);
    return this.http.post<EventDetailsDto>(this.apiUrl, payload).pipe(
      map(resDto => this.mapDetailsToEvent(resDto)),
      catchError(this.handleError)
    );
  }

  updateEvent(id: string, dto: UpdateEventDto): Observable<Event | null> {
    const payload = this.prepareUpdatePayload(dto);
    return this.http.patch<EventDetailsDto>(`${this.apiUrl}/${id}`, payload).pipe(
      map(resDto => this.mapDetailsToEvent(resDto)),
      catchError(error => {
        if (error.status === 404) return of(null);
        return this.handleError(error);
      })
    );
  }

  deleteEvent(id: string): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${id}`, { observe: 'response' }).pipe(
      map(response => response.status === 204),
      catchError(() => of(false))
    );
  }

  joinEvent(eventId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${eventId}/join`, {}).pipe(
      map(response => ({ success: true, message: response.message })),
      catchError(this.handleError)
    );
  }

  leaveEvent(eventId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${eventId}/leave`, {}).pipe(
      map(response => ({ success: true, message: response.message })),
      catchError(this.handleError)
    );
  }

  private mapSummaryToEvent(dto: EventSummaryDto): Event {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      date: new Date(dto.dateTime),
      location: dto.location,
      capacity: dto.capacity,
      participants: dto.participantCount,
      participantNames: [],
      visibility: 'Public',
      organizerId: ''
    };
  }

  private mapDetailsToEvent(dto: EventDetailsDto): Event {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      date: new Date(dto.dateTime),
      location: dto.location,
      capacity: dto.capacity,
      participants: dto.participantCount,
      participantNames: dto.participantNames,
      visibility: dto.visibility as 'Public' | 'Private',
      organizerId: dto.organizerId
    };
  }
  
  private prepareCreatePayload(dto: CreateEventDto): object {
    const dateTime = this.combineDateTime(dto.date, dto.time);
    return {
      title: dto.title,
      description: dto.description,
      date: dateTime.toISOString(),
      location: dto.location,
      capacity: dto.capacity,
      visibility: dto.visibility
    };
  }

  private prepareUpdatePayload(dto: UpdateEventDto): object {
    const payload: any = {};
    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.location !== undefined) payload.location = dto.location;
    if (dto.capacity !== undefined) payload.capacity = dto.capacity;
    if (dto.visibility !== undefined) payload.visibility = dto.visibility;
    if (dto.date && dto.time) {
      payload.date = this.combineDateTime(dto.date, dto.time).toISOString();
    }
    return payload;
  }

  private combineDateTime(date: Date | null, time: string | null): Date {
    if (!date || !time) {
      console.error('Invalid date or time provided for combination', { date, time });
      throw new Error('Invalid date or time provided');
    }
    
    let hours: number;
    let minutes: number;
    const timeTrimmed = time.trim().toUpperCase();

    try {
      if (timeTrimmed.includes('AM') || timeTrimmed.includes('PM')) {
        const parts = timeTrimmed.replace('AM', ' AM').replace('PM', ' PM').split(/[\s:]+/);
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
        const meridiem = parts[2];

        if (meridiem === 'PM' && hours < 12) {
          hours += 12;
        } else if (meridiem === 'AM' && hours === 12) {
          hours = 0;
        }
      } else {
        const [hourStr, minuteStr] = timeTrimmed.split(':');
        hours = parseInt(hourStr, 10);
        minutes = parseInt(minuteStr, 10);
      }

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          throw new Error('Parsed time is invalid');
      }
    } catch (e) {
      console.error('Failed to parse time string:', time, e);
      throw new Error('Invalid time format');
    }

    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);

    if (isNaN(combined.getTime())) {
      console.error('Failed to create a valid date from:', { date, time });
      throw new Error('Invalid date/time combination');
    }
    
    console.log(`✅ Combined date and time: ${combined.toISOString()}`);
    return combined;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ API Error:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error.error?.message) { errorMessage = error.error.message; }
    else if (error.status === 0) { errorMessage = 'Could not connect to the server.'; }
    return throwError(() => ({ message: errorMessage, status: error.status }));
  }
}

