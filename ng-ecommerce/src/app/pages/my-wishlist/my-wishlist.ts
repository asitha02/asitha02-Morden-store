import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../components/product-card/product-card';
import { ProductStore } from '../../services/product-store';
import { WishlistStore } from '../../services/wishlist-store';

@Component({
  imports: [MatButton, MatIcon, RouterLink, ProductCard],
  selector: 'app-my-wishlist',
  styles: ``,
  template: `
    <h1 class="text-2xl font-semibold mb-4">My wishlist</h1>

    @if (items().length) {
      <div class="responsive-grid">
        @for (p of items(); track p.id) {
          <app-product-card [product]="p" />
        }
      </div>
    } @else {
      <div class="text-center bg-white border border-dashed border-slate-300 rounded-xl p-10">
        <mat-icon class="!w-12 !h-12 !text-5xl text-slate-300">favorite_border</mat-icon>
        <p class="font-medium mt-2">Your wishlist is empty</p>
        <p class="text-slate-500 mb-4">Tap the heart on any part to save it here.</p>
        <button matButton="filled" routerLink="/products">Browse parts</button>
      </div>
    }
  `,
})
export default class MyWishlist {
  private readonly store = inject(ProductStore);
  private readonly wishlist = inject(WishlistStore);

  protected readonly items = computed(() => {
    const ids = this.wishlist.all();
    return this.store.products().filter((p) => ids.includes(p.id));
  });
}
