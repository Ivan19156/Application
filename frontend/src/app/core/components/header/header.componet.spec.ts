import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component'; // <-- Змінено

describe('HeaderComponent', () => { // <-- Змінено
  let component: HeaderComponent; // <-- Змінено
  let fixture: ComponentFixture<HeaderComponent>; // <-- Змінено

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent] // <-- Змінено
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HeaderComponent); // <-- Змінено
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});