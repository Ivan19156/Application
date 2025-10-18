import { ComponentFixture, TestBed } from '@angular/core/testing';

// 1. Імпортуємо правильний клас
import { LoginComponent } from './login.component';

describe('LoginComponent', () => { // <-- 2. Оновлюємо назву для ясності
  let component: LoginComponent; // <-- 3. Змінюємо тип
  let fixture: ComponentFixture<LoginComponent>; // <-- 4. Змінюємо тип

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent] // <-- 5. Використовуємо правильний клас
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent); // <-- 6. І тут теж
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});