import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { MoneyPipe } from '../../pipes/money';
import { CartStore } from '../../services/cart-store';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButton,
    MatIconButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MoneyPipe,
  ],
  selector: 'app-cart',
  styles: ``,
  template: `
    <h1 class="text-2xl font-semibold mb-4">Your cart</h1>

    @if (cart.items().length === 0) {
      <div class="text-center bg-white border border-dashed border-slate-300 rounded-xl p-10">
        <mat-icon class="!w-12 !h-12 !text-5xl text-slate-300">shopping_cart</mat-icon>
        <p class="font-medium mt-2">Your cart is empty</p>
        <p class="text-slate-500 mb-4">Browse the spare parts and add what you need.</p>
        <button matButton="filled" routerLink="/products">Browse parts</button>
      </div>
    } @else {
      <div class="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <!-- Items (editable before purchase) -->
        <div class="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          @for (item of cart.items(); track item.product.id) {
            <div class="p-3 sm:p-4 flex flex-wrap gap-4 items-center">
              <a
                [routerLink]="['/products', item.product.id]"
                class="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0"
              >
                @if (item.product.images[0]) {
                  <img [src]="item.product.images[0]" [alt]="item.product.name" class="w-full h-full object-cover" />
                } @else {
                  <mat-icon class="!w-10 !h-10 !text-[40px] text-slate-300">build</mat-icon>
                }
              </a>

              <div class="flex-1 min-w-[160px]">
                <span class="font-mono text-xs text-slate-500">{{ item.product.itemCode }}</span>
                <a
                  [routerLink]="['/products', item.product.id]"
                  class="block font-medium hover:underline"
                  >{{ item.product.name }}</a
                >
                <span class="text-xs text-slate-500">
                  {{ item.product.brand }} · {{ item.product.vehicleType }}
                </span>
                <div class="text-sm mt-1">{{ item.product.price | money }} each</div>
              </div>

              <div class="flex items-center border border-slate-300 rounded-md">
                <button
                  matIconButton
                  class="small"
                  aria-label="Decrease quantity"
                  [disabled]="item.quantity <= 1"
                  (click)="cart.setQuantity(item.product, item.quantity - 1)"
                >
                  <mat-icon class="small">remove</mat-icon>
                </button>
                <span class="w-9 text-center text-sm font-medium">{{ item.quantity }}</span>
                <button
                  matIconButton
                  class="small"
                  aria-label="Increase quantity"
                  [disabled]="item.quantity >= item.product.stock"
                  (click)="cart.setQuantity(item.product, item.quantity + 1)"
                >
                  <mat-icon class="small">add</mat-icon>
                </button>
              </div>

              <div class="w-32 text-right font-semibold">{{ item.lineTotal | money }}</div>

              <button
                matIconButton
                class="danger"
                aria-label="Remove from cart"
                (click)="cart.remove(item.product.id)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          }

          <div class="p-3 sm:p-4 flex justify-between">
            <button matButton routerLink="/products">
              <mat-icon>arrow_back</mat-icon> Continue shopping
            </button>
            <button matButton class="danger" (click)="cart.clear()">Clear cart</button>
          </div>
        </div>

        <!-- Summary -->
        <form
          [formGroup]="customer"
          (ngSubmit)="placeOrder()"
          class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 lg:sticky lg:top-24"
        >
          <h2 class="font-semibold text-lg mb-1">Order summary</h2>

          <div class="flex justify-between text-sm">
            <span class="text-slate-600">Different items</span>
            <span>{{ cart.items().length }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">Total quantity</span>
            <span>{{ cart.count() }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">Subtotal</span>
            <span>{{ cart.total() | money }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t border-slate-200 pt-2 mt-1 mb-3">
            <span>Total</span>
            <span>{{ cart.total() | money }}</span>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Customer name</mat-label>
            <input matInput formControlName="name" />
            <mat-error>Please enter a name</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Phone (optional)</mat-label>
            <input matInput formControlName="phone" type="tel" />
          </mat-form-field>

          <button matButton="filled" type="submit">Place order</button>
        </form>
      </div>
    }
  `,
})
export default class Cart {
  protected readonly cart = inject(CartStore);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly customer = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    phone: [''],
  });

  protected placeOrder(): void {
    if (this.customer.invalid) {
      this.customer.markAllAsTouched();
      return;
    }
    const v = this.customer.getRawValue();
    const order = this.cart.checkout({ name: v.name.trim(), phone: v.phone.trim() });
    if (!order) return;
    this.snack.open(`Order ${order.orderNo} saved`, 'OK', { duration: 3000 });
    this.customer.reset();
    this.router.navigateByUrl('/dashboard');
  }
}
