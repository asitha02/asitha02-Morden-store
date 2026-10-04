import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { OrderLine } from '../../models/order';
import { MoneyPipe } from '../../pipes/money';
import { OrderStore } from '../../services/order-store';
import { ProductStore } from '../../services/product-store';

@Component({
  imports: [RouterLink, MatButton, MatIconButton, MatFormField, MatLabel, MatIcon, MatInput, MoneyPipe],
  selector: 'app-edit-order',
  styles: ``,
  template: `
    <a routerLink="/dashboard" class="inline-flex items-center gap-1 text-sm text-slate-600 hover:underline mb-4">
      <mat-icon class="small">arrow_back</mat-icon> Back to dashboard
    </a>

    @if (order(); as o) {
      <h1 class="text-2xl font-semibold mb-4">Edit order {{ o.orderNo }}</h1>

      <div class="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <!-- Items -->
        <div class="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          @for (l of draft(); track l.productId) {
            <div class="p-3 sm:p-4 flex flex-wrap items-center gap-4">
              <div class="flex-1 min-w-[160px]">
                <span class="font-mono text-xs text-slate-500">{{ l.itemCode }}</span>
                <div class="font-medium">{{ l.name }}</div>
                <div class="text-sm text-slate-600">{{ l.unitPrice | money }} each</div>
              </div>

              <div class="flex items-center border border-slate-300 rounded-md">
                <button
                  matIconButton
                  class="small"
                  aria-label="Decrease quantity"
                  [disabled]="l.quantity <= 1"
                  (click)="setQuantity(l, l.quantity - 1)"
                >
                  <mat-icon class="small">remove</mat-icon>
                </button>
                <span class="w-9 text-center text-sm font-medium">{{ l.quantity }}</span>
                <button
                  matIconButton
                  class="small"
                  aria-label="Increase quantity"
                  [disabled]="l.quantity >= maxQuantity(l)"
                  (click)="setQuantity(l, l.quantity + 1)"
                >
                  <mat-icon class="small">add</mat-icon>
                </button>
              </div>

              <div class="w-32 text-right font-semibold">{{ l.unitPrice * l.quantity | money }}</div>

              <button
                matIconButton
                class="danger"
                aria-label="Remove item"
                [disabled]="draft().length <= 1"
                (click)="removeLine(l)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          }
        </div>

        <!-- Customer + total -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 lg:sticky lg:top-24">
          <h2 class="font-semibold text-lg mb-1">Order details</h2>

          <mat-form-field appearance="outline">
            <mat-label>Customer name</mat-label>
            <input matInput [value]="name()" (input)="name.set($any($event.target).value)" />
          </mat-form-field>
          @if (nameError()) {
            <p class="text-xs text-red-600 -mt-1">Please enter a name</p>
          }
          <mat-form-field appearance="outline">
            <mat-label>Phone (optional)</mat-label>
            <input matInput type="tel" [value]="phone()" (input)="phone.set($any($event.target).value)" />
          </mat-form-field>

          <div class="flex justify-between text-sm">
            <span class="text-slate-600">Total quantity</span>
            <span>{{ quantityTotal() }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t border-slate-200 pt-2 mt-1 mb-2">
            <span>Total</span>
            <span>{{ total() | money }}</span>
          </div>

          <button matButton="filled" (click)="save()">Save changes</button>
          <button matButton routerLink="/dashboard">Cancel</button>
          <button matButton="outlined" class="danger" (click)="deleteOrder()">
            <mat-icon>delete</mat-icon> Delete order
          </button>
        </div>
      </div>
    } @else {
      <div class="text-center bg-white border border-slate-200 rounded-xl p-10">
        <mat-icon class="!w-12 !h-12 !text-5xl text-slate-300">error_outline</mat-icon>
        <p class="font-medium mt-2">Order not found</p>
        <button matButton="filled" routerLink="/dashboard">Back to dashboard</button>
      </div>
    }
  `,
})
export default class EditOrder {
  /** Bound from the route (/dashboard/orders/:id) */
  readonly id = input.required<string>();

  private readonly orders = inject(OrderStore);
  private readonly products = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly order = computed(() => this.orders.orders().find((o) => o.id === this.id()));

  // Working copies – nothing is saved until "Save changes".
  protected readonly draft = linkedSignal<OrderLine[]>(
    () => this.order()?.lines.map((l) => ({ ...l })) ?? [],
  );
  protected readonly name = linkedSignal(() => this.order()?.customer.name ?? '');
  protected readonly phone = linkedSignal(() => this.order()?.customer.phone ?? '');
  protected readonly nameError = signal(false);

  protected readonly total = computed(() =>
    this.draft().reduce((s, l) => s + l.unitPrice * l.quantity, 0),
  );
  protected readonly quantityTotal = computed(() =>
    this.draft().reduce((s, l) => s + l.quantity, 0),
  );

  /** Most the customer can have = what the order already holds + what is still in stock. */
  protected maxQuantity(line: OrderLine): number {
    const original = this.order()?.lines.find((l) => l.productId === line.productId)?.quantity ?? 0;
    const stock = this.products.products().find((p) => p.id === line.productId)?.stock ?? 0;
    return original + stock;
  }

  protected setQuantity(line: OrderLine, quantity: number): void {
    const q = Math.max(1, Math.min(quantity, this.maxQuantity(line)));
    this.draft.update((list) =>
      list.map((l) => (l.productId === line.productId ? { ...l, quantity: q } : l)),
    );
  }

  protected removeLine(line: OrderLine): void {
    if (this.draft().length <= 1) return;
    this.draft.update((list) => list.filter((l) => l.productId !== line.productId));
  }

  protected async deleteOrder(): Promise<void> {
    const o = this.order();
    if (!o) return;
    if (!confirm(`Delete order ${o.orderNo}? Its items will go back into stock. This cannot be undone.`)) return;
    if (!(await this.orders.remove(o.id))) {
      this.snack.open('Could not delete the order – the server is not reachable', 'OK', { duration: 4000 });
      return;
    }
    this.snack.open(`Order ${o.orderNo} deleted`, 'OK', { duration: 3000 });
    this.router.navigateByUrl('/dashboard');
  }

  protected async save(): Promise<void> {
    const name = this.name().trim();
    this.nameError.set(!name);
    if (!name || !this.draft().length) return;

    const updated = await this.orders.update(
      this.id(),
      { name, phone: this.phone().trim() },
      this.draft().map((l) => ({ productId: l.productId, quantity: l.quantity })),
    );
    if (!updated) {
      this.snack.open('Could not save – not enough stock, or the server is not reachable', 'OK', {
        duration: 4000,
      });
      return;
    }
    this.snack.open(`Order ${updated.orderNo} updated`, 'OK', { duration: 3000 });
    this.router.navigateByUrl('/dashboard');
  }
}
