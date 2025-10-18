import { ComponentFixture, TestBed } from '@angular/core/testing';

// 1. Імпортуємо правильний клас
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => { // <-- 2. Оновлюємо назву
  let component: MainLayoutComponent; // <-- 3. Змінюємо тип
  let fixture: ComponentFixture<MainLayoutComponent>; // <-- 4. Змінюємо тип

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent] // <-- 5. Використовуємо правильний клас
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent); // <-- 6. І тут теж
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});