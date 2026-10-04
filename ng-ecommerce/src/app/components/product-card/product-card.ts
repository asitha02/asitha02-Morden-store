import { Component, inject, input } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { MoneyPipe } from '../../pipes/money';
import { CartStore } from '../../services/cart-store';
import { WishlistStore } from '../../services/wishlist-store';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, MatButton, MatIconButton, MatIcon, MoneyPipe],
  styles: ``,
  template: `
    <div
      class="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div class="relative">
        <a [routerLink]="['/products', product().id]" class="block">
          <div class="aspect-[4/3] bg-slate-100 flex items-center justify-center">
            @if (product().images[0]) {
              <img
                [src]="product().images[0]"
                [alt]="product().name"
                class="w-full h-full object-cover"
              />
            } @else {
              <mat-icon class="!w-16 !h-16 !text-[64px] text-slate-300">build</mat-icon>
            }
          </div>
        </a>

        @if (product().stock < 1) {
          <span
            class="absolute top-2 left-2 text-xs font-medium bg-red-600 text-white rounded-full px-2 py-0.5"
            >Out of stock</span
          >
        }

        <button
          matIconButton
          class="!absolute top-1 right-1 !bg-white/80"
          (click)="wishlist.toggle(product().id)"
          [attr.aria-label]="wishlist.has(product().id) ? 'Remove from wishlist' : 'Add to wishlist'"
        >
          <mat-icon [class.danger]="wishlist.has(product().id)">
            {{ wishlist.has(product().id) ? 'favorite' : 'favorite_border' }}
          </mat-icon>
        </button>
      </div>

      <div class="flex flex-col gap-1 p-3 flex-1">
        <span class="font-mono text-xs text-slate-500">{{ product().itemCode }}</span>
        <a
          [routerLink]="['/products', product().id]"
          class="font-medium text-slate-900 hover:underline line-clamp-2"
          >{{ product().name }}</a
        >
        <span class="text-xs text-slate-500">{{ product().brand }} · {{ product().category }}</span>
        <span
          class="self-start text-xs bg-slate-100 text-slate-700 rounded-full px-2 py-0.5 mt-1"
          >{{ product().vehicleType }}</span
        >

        <div class="mt-auto pt-3 flex items-center justify-between gap-2">
          <span class="font-semibold text-lg">{{ product().price | money }}</span>
          <button
            matButton="filled"
            [disabled]="product().stock < 1"
            (click)="addToCart()"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();

  protected readonly cart = inject(CartStore);
  protected readonly wishlist = inject(WishlistStore);
  private readonly snack = inject(MatSnackBar);

  protected addToCart(): void {
    const p = this.product();
    const result = this.cart.add(p);
    if (result === 'added') {
      this.snack.open(`${p.name} added to cart`, 'OK', { duration: 2000 });
    } else if (result === 'max') {
      this.snack.open(`Only ${p.stock} in stock – all of them are in your cart`, 'OK', {
        duration: 3000,
      });
    } else {
      this.snack.open('This item is out of stock', 'OK', { duration: 2000 });
    }
  }
}
