import { ComponentFixture, TestBed } from '@angular/core/testing';

// 1. Змінили шлях та назву класу
import { FooterComponent } from './footer.component'; 

describe('FooterComponent', () => { // <-- (Опціонально, але краще змінити)
  let component: FooterComponent; // <-- 2. Змінили тип
  let fixture: ComponentFixture<FooterComponent>; // <-- 3. Змінили тип

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent] // <-- 4. Змінили імпортований клас
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FooterComponent); // <-- 5. Змінили клас
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});