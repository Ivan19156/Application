import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component'; // <-- Змінено

describe('AppComponent', () => { // <-- Змінено
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent], // <-- Змінено
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent); // <-- Змінено
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'frontend' title`, () => {
    const fixture = TestBed.createComponent(AppComponent); // <-- Змінено
    const app = fixture.componentInstance;
    expect(app.title).toEqual('frontend');
  });

  // Цей тест можна видалити, бо ми прибрали стандартну розмітку
  /*
  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, frontend');
  });
  */
});