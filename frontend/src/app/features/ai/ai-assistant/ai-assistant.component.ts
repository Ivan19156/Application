import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { AiService, AIResponseDto } from '../../..//core/services/ai.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.scss'
})
export class AiAssistantComponent {
  private aiService = inject(AiService);

  messages = signal<ChatMessage[]>([
    { sender: 'ai', text: "Hello! How can I help you with your events today?" }
  ]);
  
  isLoading = signal(false);
  chatControl = new FormControl('', { nonNullable: true });

  sendMessage(): void {
    const question = this.chatControl.value.trim();
    if (!question || this.isLoading()) {
      return;
    }

    this.messages.update(msgs => [...msgs, { sender: 'user', text: question }]);
    this.chatControl.setValue('');
    this.isLoading.set(true);

    this.aiService.askQuestion(question).subscribe({
      next: (response: AIResponseDto) => {
        this.messages.update(msgs => [...msgs, { sender: 'ai', text: response.answer }]);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        const errorMessage = error.answer || 'Sorry, something went wrong.';
        this.messages.update(msgs => [...msgs, { sender: 'ai', text: errorMessage }]);
        this.isLoading.set(false);
      }
    });
  }
}