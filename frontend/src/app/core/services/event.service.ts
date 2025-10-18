import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import * as moment from 'moment'; // Assuming you're using moment for date objects from MatDatepicker

// --- Interfaces ---

export interface Event {
  id: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  capacity: number | null; // Allow null for unlimited
  participants: number;
  participantNames: string[];
  visibility: 'Public' | 'Private';
  organizerId: string; // To identify who can edit/delete
}

export interface CreateEventDto {
  title: string;
  description: string;
  date: moment.Moment; // Expecting Moment object from MatDatepicker
  time: string; // Expecting "HH:mm" string from Timepicker
  location: string;
  capacity: number | null;
  visibility: 'Public' | 'Private';
}

// --- Service ---

@Injectable({
  providedIn: 'root'
})
export class EventService {

  // --- Mock Data ---

  private mockEvents: Event[] = [
    // Your existing mock events array...
   {
      id: '1', name: 'Angular Conference 2025', description: '...', date: new Date(2025, 10, 5, 9, 0), location: 'Kyiv, Ukraine', capacity: 500, participants: 3, // Update count
      participantNames: ['Alice', 'Bob', 'Charlie'], // <-- ADD NAMES
      visibility: 'Public', organizerId: 'user1'
    },
    {
      id: '2', name: '.NET Developers Meetup', description: '...', date: new Date(2025, 10, 12, 18, 30), location: 'Lviv, Ukraine', capacity: 50, participants: 2, // Update count
      participantNames: ['David', 'Eve'], // <-- ADD NAMES
      visibility: 'Public', organizerId: 'user1'
    },
    {
      id: '3', name: 'Frontend Workshop', description: '...', date: new Date(2025, 10, 17, 10, 0), location: 'Online', capacity: 100, participants: 1, // Update count
      participantNames: ['Frank'], // <-- ADD NAMES
      visibility: 'Public', organizerId: 'user2'
    },
    // ... Add participantNames to other events or leave them empty [] ...
     {
      id: '4', name: 'Tech Talks: AI & ML', description: '...', date: new Date(2025, 10, 20, 14, 0), location: 'Kyiv, Podil', capacity: 200, participants: 0,
      participantNames: [], visibility: 'Public', organizerId: 'user2'
    },
    {
      id: '5', name: 'Morning Yoga Session', description: '...', date: new Date(2025, 10, 20, 7, 0), location: 'Central Park', capacity: 30, participants: 0,
      participantNames: [], visibility: 'Public', organizerId: 'user3'
    }
    
  ];

  constructor() {
    console.log('📅 EventService initialized with events:', this.mockEvents.length);
  }

  // --- Read Operations ---

  // Get all public events
  getEvents(): Observable<Event[]> { // Без searchTerm
  console.log('🔍 getEvents called (simple version)');
  const publicEvents = this.mockEvents.filter(e => e.visibility === 'Public');
  return of(publicEvents).pipe(delay(300));
}

  // Get a single event by its ID
  getEventById(id: string): Observable<Event | undefined> {
    console.log(`🔍 getEventById called for ID: ${id}`);
    const event = this.mockEvents.find(e => e.id === id);
    return of(event).pipe(delay(300));
  }

  // Get events for the current user (for the calendar)
  getMyEvents(): Observable<Event[]> {
    console.log('🔍 getMyEvents called');
    // In a real app, filter by userId
    return of(this.mockEvents).pipe(delay(300));
  }

  // --- Write Operations ---

  // Create a new event
  createEvent(dto: CreateEventDto): Observable<Event> {
    console.log('➕ createEvent called with DTO:', dto);
    const eventDateTime = this.combineDateTime(dto.date, dto.time);
    const newId = (this.mockEvents.length + 1).toString();

    const newEvent: Event = {
      id: newId,
      name: dto.title,
      description: dto.description || '',
      date: eventDateTime,
      location: dto.location,
      capacity: dto.capacity === null || dto.capacity === undefined ? null : Number(dto.capacity), // Ensure null if empty, otherwise number
      participants: 0,
      participantNames: [],
      visibility: dto.visibility,
      organizerId: 'current-user' // Replace with actual user ID
    };

    this.mockEvents.push(newEvent);
    console.log('✅ Event created:', newEvent);

    return of(newEvent).pipe(delay(500));
  }

  // Update an existing event
  updateEvent(id: string, dto: Partial<CreateEventDto>): Observable<Event | null> {
    console.log(`✏️ updateEvent called for ID: ${id} with DTO:`, dto);
    const eventIndex = this.mockEvents.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      console.error(`❌ Event with ID ${id} not found for update.`);
      return of(null).pipe(delay(300));
    }

    const event = { ...this.mockEvents[eventIndex] }; // Create a copy to modify

    if (dto.title !== undefined) event.name = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.date && dto.time) {
      event.date = this.combineDateTime(dto.date, dto.time);
    }
    if (dto.location !== undefined) event.location = dto.location;
    if (dto.capacity !== undefined) event.capacity = dto.capacity === null ? null : Number(dto.capacity);
    if (dto.visibility !== undefined) event.visibility = dto.visibility;

    this.mockEvents[eventIndex] = event; // Update the array
    console.log('✅ Event updated:', event);

    return of(event).pipe(delay(500));
  }

  // Delete an event
  deleteEvent(id: string): Observable<boolean> {
    console.log(`🗑️ deleteEvent called for ID: ${id}`);
    const eventIndex = this.mockEvents.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      console.error(`❌ Event with ID ${id} not found for deletion.`);
      return of(false).pipe(delay(300));
    }

    this.mockEvents.splice(eventIndex, 1);
    console.log(`✅ Event with ID ${id} deleted.`);
    return of(true).pipe(delay(300));
  }

  // --- Participation Operations ---

  joinEvent(eventId: string): Observable<{ success: boolean; message?: string }> {
    console.log(`➕ Joining event ${eventId}`);
    const event = this.mockEvents.find(e => e.id === eventId);
    if (!event) {
      return throwError(() => ({ success: false, message: 'Event not found' })).pipe(delay(300));
    }
    if (event.capacity !== null && event.participants >= event.capacity) {
      return throwError(() => ({ success: false, message: 'Event is full' })).pipe(delay(300));
    }

    event.participants++;
    console.log(`✅ Event ${eventId} participants updated to ${event.participants}`);
    return of({ success: true }).pipe(delay(500));
  }

  leaveEvent(eventId: string): Observable<{ success: boolean; message?: string }> {
    console.log(`➖ Leaving event ${eventId}`);
    const event = this.mockEvents.find(e => e.id === eventId);
    if (!event) {
      return throwError(() => ({ success: false, message: 'Event not found' })).pipe(delay(300));
    }
    // Assuming a user can only leave if they are a participant (check needed in real app)
    if (event.participants > 0) {
      event.participants--;
      console.log(`✅ Event ${eventId} participants updated to ${event.participants}`);
      return of({ success: true }).pipe(delay(500));
    } else {
      // Should not happen if logic is correct, but handle defensively
      return throwError(() => ({ success: false, message: 'Cannot leave event with 0 participants' })).pipe(delay(300));
    }
  }

  // --- Helper Methods ---

  private combineDateTime(date: moment.Moment, time: string): Date {
    if (!date || !time) {
      // Handle cases where date or time might be missing
      console.error("Cannot combine date and time: one is missing.");
      return new Date(); // Or throw an error
    }
    try {
      const [hours, minutes] = time.split(':').map(Number);
      // Clone the moment object before modifying it
      return date.clone().hour(hours).minute(minutes).second(0).millisecond(0).toDate();
    } catch (error) {
      console.error("Error combining date and time:", error, { date, time });
      return new Date(); // Fallback to current date or handle error appropriately
    }
  }
}