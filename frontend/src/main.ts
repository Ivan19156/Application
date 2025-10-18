import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// 👇 Помилка була тут. Клас називається AppComponent, а не App.
import { AppComponent } from './app/app.component';

// 👇 І тут, відповідно, теж.
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));