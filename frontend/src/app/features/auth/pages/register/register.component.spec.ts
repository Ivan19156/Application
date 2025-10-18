import { ComponentFixture, TestBed } from '@angular/core/testing';

// 1. Імпортуємо правильний клас
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => { // <-- 2. Оновлюємо назву
  let component: RegisterComponent; // <-- 3. Змінюємо тип
  let fixture: ComponentFixture<RegisterComponent>; // <-- 4. Змінюємо тип

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent] // <-- 5. Використовуємо правильний клас
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent); // <-- 6. І тут теж
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});