import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';

@Component({
  imports: [RouterOutlet, Header],
  selector: 'app-root',
  styles: [],
  template: `
    <app-header />
    <main class="max-w-[1200px] mx-auto w-full p-4 sm:p-6">
      <router-outlet />
    </main>
  `,
})
export class App {}
