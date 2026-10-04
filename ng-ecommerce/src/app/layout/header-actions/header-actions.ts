import { Component, inject } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../services/cart-store';
import { WishlistStore } from '../../services/wishlist-store';

@Component({
  imports: [MatIconButton, MatIcon, MatBadge, RouterLink],
  selector: 'app-header-actions',
  styles: ``,
  template: `
    <div class="flex items-center gap-2">
      <button matIconButton routerLink="/wishlist" aria-label="Wishlist">
        <mat-icon
          [matBadge]="wishlist.count()"
          [matBadgeHidden]="wishlist.count() === 0"
          matBadgeSize="small"
          >favorite</mat-icon
        >
      </button>
      <button matIconButton routerLink="/cart" aria-label="Cart">
        <mat-icon
          [matBadge]="cart.count()"
          [matBadgeHidden]="cart.count() === 0"
          matBadgeColor="warn"
          matBadgeSize="small"
          >shopping_cart</mat-icon
        >
      </button>
    </div>
  `,
})
export class HeaderActions {
  protected readonly cart = inject(CartStore);
  protected readonly wishlist = inject(WishlistStore);
}
