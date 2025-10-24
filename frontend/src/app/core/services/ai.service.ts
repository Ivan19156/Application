import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface AskQuestionDto {
  question: string;
}

export interface AIResponseDto {
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ai`;

  askQuestion(question: string): Observable<AIResponseDto> {
    console.log(`💬 AI Service: Sending question to API: "${question}"`);
    
    const payload: AskQuestionDto = { question };

    return this.http.post<AIResponseDto>(`${this.apiUrl}/ask`, payload).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ AI Service API Error:', error);
    let errorMessage = 'An error occurred while contacting the AI assistant.';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Authentication error. Please log in again.';
    } else if (error.status === 0 || error.status === 503) {
      errorMessage = 'Could not connect to the AI service.';
    }
    
    return throwError(() => ({ answer: errorMessage }));
  }
}

