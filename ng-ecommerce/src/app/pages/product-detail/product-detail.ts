import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../components/product-card/product-card';
import { MoneyPipe } from '../../pipes/money';
import { CartStore } from '../../services/cart-store';
import { ProductStore } from '../../services/product-store';
import { WishlistStore } from '../../services/wishlist-store';

@Component({
  imports: [RouterLink, MatButton, MatIconButton, MatIcon, MoneyPipe, ProductCard],
  selector: 'app-product-detail',
  styles: ``,
  template: `
    <a routerLink="/products" class="inline-flex items-center gap-1 text-sm text-slate-600 hover:underline mb-4">
      <mat-icon class="small">arrow_back</mat-icon> Back to all parts
    </a>

    @if (product(); as p) {
      <div class="grid gap-6 md:grid-cols-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
        <!-- Image -->
        <div>
          <div class="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
            @if (p.images[selectedImage()]; as img) {
              <img [src]="img" [alt]="p.name" class="w-full h-full object-contain" />
            } @else {
              <mat-icon class="!w-32 !h-32 !text-[128px] text-slate-300">build</mat-icon>
            }
          </div>
          @if (p.images.length > 1) {
            <div class="flex gap-2 mt-3 flex-wrap">
              @for (img of p.images; track $index) {
                <button
                  type="button"
                  class="w-16 h-16 rounded-md overflow-hidden border-2 bg-slate-100"
                  [class]="$index === selectedImage() ? 'border-blue-600' : 'border-transparent'"
                  [attr.aria-label]="'Show picture ' + ($index + 1)"
                  (click)="selectedImage.set($index)"
                >
                  <img [src]="img" alt="" class="w-full h-full object-cover" />
                </button>
              }
            </div>
          }
        </div>

        <!-- Details -->
        <div class="flex flex-col gap-3">
          <span class="font-mono text-sm bg-slate-100 self-start rounded px-2 py-0.5">
            Item code: {{ p.itemCode }}
          </span>
          <h1 class="text-2xl font-semibold">{{ p.name }}</h1>

          <div class="text-3xl font-bold">{{ p.price | money }}</div>

          @if (p.stock > 0) {
            <span class="text-sm text-green-700 font-medium">
              In stock ({{ p.stock }} available)
            </span>
          } @else {
            <span class="text-sm text-red-600 font-medium">Out of stock</span>
          }

          <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm border-y border-slate-200 py-3">
            <dt class="text-slate-500">Category</dt>
            <dd>{{ p.category }}</dd>
            <dt class="text-slate-500">Brand</dt>
            <dd>{{ p.brand }}</dd>
            <dt class="text-slate-500">Vehicle type</dt>
            <dd>{{ p.vehicleType }}</dd>
          </dl>

          <div>
            <h2 class="font-medium mb-1">Description</h2>
            <p class="text-slate-700 whitespace-pre-line">{{ p.description }}</p>
          </div>

          <!-- Quantity + add to cart -->
          <div class="mt-auto pt-2 flex flex-wrap items-center gap-3">
            <div class="flex items-center border border-slate-300 rounded-md">
              <button
                matIconButton
                aria-label="Decrease quantity"
                [disabled]="qty() <= 1 || p.stock < 1"
                (click)="qty.set(qty() - 1)"
              >
                <mat-icon>remove</mat-icon>
              </button>
              <span class="w-10 text-center font-medium">{{ qty() }}</span>
              <button
                matIconButton
                aria-label="Increase quantity"
                [disabled]="qty() >= p.stock"
                (click)="qty.set(qty() + 1)"
              >
                <mat-icon>add</mat-icon>
              </button>
            </div>

            <button matButton="filled" [disabled]="p.stock < 1" (click)="addToCart()">
              <mat-icon>add_shopping_cart</mat-icon>
              Add to cart
            </button>

            <button matIconButton aria-label="Toggle wishlist" (click)="wishlist.toggle(p.id)">
              <mat-icon [class.danger]="wishlist.has(p.id)">
                {{ wishlist.has(p.id) ? 'favorite' : 'favorite_border' }}
              </mat-icon>
            </button>
          </div>

          @if (inCart() > 0) {
            <p class="text-sm text-slate-600">
              {{ inCart() }} in your cart ·
              <a routerLink="/cart" class="text-blue-700 hover:underline">Go to cart</a>
            </p>
          }
        </div>
      </div>

      @if (related().length) {
        <h2 class="text-lg font-semibold mt-8 mb-3">Related parts</h2>
        <div class="responsive-grid">
          @for (r of related(); track r.id) {
            <app-product-card [product]="r" />
          }
        </div>
      }
    } @else {
      <div class="text-center bg-white border border-slate-200 rounded-xl p-10">
        <mat-icon class="!w-12 !h-12 !text-5xl text-slate-300">error_outline</mat-icon>
        <p class="font-medium mt-2">Product not found</p>
        <p class="text-slate-500 mb-4">It may have been removed.</p>
        <button matButton="filled" routerLink="/products">Back to all parts</button>
      </div>
    }
  `,
})
export default class ProductDetail {
  /** Bound from the route (/products/:id) thanks to withComponentInputBinding() */
  readonly id = input.required<string>();

  private readonly store = inject(ProductStore);
  private readonly cart = inject(CartStore);
  private readonly snack = inject(MatSnackBar);
  protected readonly wishlist = inject(WishlistStore);

  protected readonly product = computed(() => this.store.products().find((p) => p.id === this.id()));

  /** Resets to 1 whenever the user opens a different product. */
  protected readonly qty = linkedSignal(() => {
    this.id();
    return 1;
  });

  /** Which picture is shown big; back to the first when another product is opened. */
  protected readonly selectedImage = linkedSignal(() => {
    this.id();
    return 0;
  });

  protected readonly inCart = computed(() => this.cart.quantityOf(this.id()));

  protected readonly related = computed(() => {
    const p = this.product();
    if (!p) return [];
    return this.store
      .products()
      .filter((x) => x.id !== p.id && (x.category === p.category || x.vehicleType === p.vehicleType))
      .slice(0, 4);
  });

  protected addToCart(): void {
    const p = this.product();
    if (!p) return;
    const result = this.cart.add(p, this.qty());
    if (result === 'added') {
      this.snack.open(`${this.qty()} × ${p.name} added to cart`, 'OK', { duration: 2000 });
    } else if (result === 'max') {
      this.snack.open(`Only ${p.stock} in stock – cart updated to the maximum`, 'OK', {
        duration: 3000,
      });
    } else {
      this.snack.open('This item is out of stock', 'OK', { duration: 2000 });
    }
    this.qty.set(1);
  }
}
