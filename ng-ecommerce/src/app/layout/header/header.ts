import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HeaderActions } from '../header-actions/header-actions';

@Component({
  selector: 'app-header',
  imports: [MatToolbar, MatButton, MatIcon, RouterLink, RouterLinkActive, HeaderActions],
  styles: ``,
  template: `
    <mat-toolbar class="w-full elevated py-2 sticky top-0 z-10">
      <div class="max-w-[1200px] mx-auto w-full flex flex-wrap items-center justify-between gap-2">
        <a routerLink="/products" class="flex items-center gap-2 font-semibold text-lg no-underline text-inherit">
          <mat-icon>build_circle</mat-icon>
          <span>Modern Store</span>
        </a>

        <nav class="flex items-center gap-1">
          <a matButton routerLink="/products" routerLinkActive="active-link">Home</a>
          <a matButton routerLink="/add-product" routerLinkActive="active-link">Add product</a>
          <a matButton routerLink="/dashboard" routerLinkActive="active-link">Dashboard</a>
        </nav>

        <app-header-actions />
      </div>
    </mat-toolbar>
  `,
})
export class Header {}
