import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Observable } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

// Services & Models
import { TagDto, EventService } from '../../../../core/services/event.service';

// Angular Material
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-tag-filter',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    ReactiveFormsModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './tag-filter.component.html',
  styleUrl: './tag-filter.component.scss'
})
export class TagFilterComponent implements OnInit {
  private eventService = inject(EventService);

  // Подія, яка відправляє масив вибраних назв тегів назовні
  @Output() selectionChange = new EventEmitter<string[]>();

  tags$!: Observable<TagDto[]>;
  isLoading = true;

  // FormControl для керування вибором у mat-chip-listbox
  tagsControl = new FormControl<string[]>([]);

  ngOnInit(): void {
    // Завантажуємо всі теги при ініціалізації
    this.tags$ = this.eventService.getAllTags();
    this.tags$.subscribe(() => this.isLoading = false);

    // Відслідковуємо зміни у виборі та відправляємо їх назовні
    this.tagsControl.valueChanges.subscribe(selectedTagNames => {
      this.selectionChange.emit(selectedTagNames || []);
    });
  }
}

