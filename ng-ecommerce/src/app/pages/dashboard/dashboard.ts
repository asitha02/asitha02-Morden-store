import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Order } from '../../models/order';
import { MoneyPipe } from '../../pipes/money';
import { OrderStore } from '../../services/order-store';
import { ProductStore } from '../../services/product-store';

@Component({
  imports: [DatePipe, RouterLink, MatButton, MatIcon, MoneyPipe],
  selector: 'app-dashboard',
  styles: ``,
  template: `
    <h1 class="text-2xl font-semibold mb-4">Dashboard</h1>

    <!-- Stat tiles -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      @for (s of stats(); track s.label) {
        <a
          [routerLink]="s.link"
          class="block bg-white border border-slate-200 rounded-xl p-4 no-underline text-inherit"
          [class]="s.link ? 'hover:bg-slate-50 cursor-pointer' : ''"
        >
          <div class="flex items-center gap-2 text-slate-500 text-sm">
            <mat-icon class="small">{{ s.icon }}</mat-icon> {{ s.label }}
            @if (s.link) {
              <mat-icon class="small ml-auto">chevron_right</mat-icon>
            }
          </div>
          <div class="text-2xl font-bold mt-1">{{ s.value }}</div>
        </a>
      }
    </div>

    <!-- Low stock -->
    @if (lowStock().length) {
      <section class="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <h2 class="font-semibold mb-3">Low stock</h2>
        <div class="flex flex-wrap gap-2">
          @for (p of lowStock(); track p.id) {
            <a
              [routerLink]="['/products', p.id]"
              class="text-sm rounded-full px-3 py-1 border"
              [class]="p.stock === 0 ? 'border-red-300 bg-red-50 text-red-700' : 'border-amber-300 bg-amber-50 text-amber-800'"
            >
              {{ p.itemCode }} · {{ p.name }} ({{ p.stock === 0 ? 'out of stock' : p.stock + ' left' }})
            </a>
          }
        </div>
      </section>
    }

    <!-- Orders -->
    <section class="bg-white border border-slate-200 rounded-xl">
      <h2 class="font-semibold p-4 border-b border-slate-200">Orders</h2>

      @for (o of orders.orders(); track o.id) {
        <details class="border-b border-slate-200 last:border-b-0 group">
          <summary
            class="p-4 flex flex-wrap items-center gap-x-6 gap-y-1 cursor-pointer hover:bg-slate-50"
          >
            <span class="font-mono font-medium">{{ o.orderNo }}</span>
            <span class="text-sm text-slate-600">{{ o.createdAt | date: 'medium' }}</span>
            <span class="text-sm">{{ o.customer.name }}</span>
            <span class="text-sm text-slate-600">{{ o.itemCount }} item(s)</span>
            <span class="ml-auto font-semibold">{{ o.total | money }}</span>
          </summary>
          <div class="px-4 pb-4 overflow-x-auto">
            <div class="flex items-center justify-between gap-2 mb-2">
              <p class="text-sm text-slate-600">
                @if (o.customer.phone) {
                  Phone: {{ o.customer.phone }}
                }
              </p>
              <div class="flex items-center gap-2">
                <a matButton [routerLink]="['/dashboard/orders', o.id]">
                  <mat-icon>edit</mat-icon> Edit order
                </a>
                <button matButton="outlined" class="danger" (click)="deleteOrder(o)">
                  <mat-icon>delete</mat-icon> Delete
                </button>
              </div>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-slate-500 border-b border-slate-200">
                  <th class="py-1 pr-3 font-medium">Item code</th>
                  <th class="py-1 pr-3 font-medium">Name</th>
                  <th class="py-1 pr-3 font-medium text-right">Unit price</th>
                  <th class="py-1 pr-3 font-medium text-right">Qty</th>
                  <th class="py-1 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (l of o.lines; track l.productId) {
                  <tr class="border-b border-slate-100 last:border-b-0">
                    <td class="py-1 pr-3 font-mono text-xs">{{ l.itemCode }}</td>
                    <td class="py-1 pr-3">{{ l.name }}</td>
                    <td class="py-1 pr-3 text-right">{{ l.unitPrice | money }}</td>
                    <td class="py-1 pr-3 text-right">{{ l.quantity }}</td>
                    <td class="py-1 text-right">{{ l.lineTotal | money }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </details>
      } @empty {
        <div class="p-8 text-center">
          <p class="text-slate-500 mb-3">No orders yet.</p>
          <button matButton="filled" routerLink="/products">Browse parts</button>
        </div>
      }
    </section>
  `,
})
export default class Dashboard {
  protected readonly orders = inject(OrderStore);
  protected readonly products = inject(ProductStore);
  private readonly money = new MoneyPipe();

  protected readonly stats = computed(() => [
    { label: 'Total orders', icon: 'receipt_long', value: String(this.orders.totalOrders()), link: null },
    {
      label: 'Revenue',
      icon: 'payments',
      value: this.money.transform(this.orders.revenue()),
      link: null,
    },
    { label: 'Items sold', icon: 'shopping_bag', value: String(this.orders.itemsSold()), link: null },
    { label: 'Products listed', icon: 'inventory_2', value: String(this.products.products().length),
      link: '/dashboard/products',
    },
  ]);

  protected async deleteOrder(order: Order): Promise<void> {
    if (!confirm(`Delete order ${order.orderNo}? Its items will go back into stock. This cannot be undone.`)) {
      return;
    }
    if (!(await this.orders.remove(order.id))) {
      alert('Could not delete the order – the server is not reachable.');
    }
  }

  protected readonly lowStock = computed(() =>
    this.products
      .products()
      .filter((p) => p.stock <= 5)
      .sort((a, b) => a.stock - b.stock),
  );
}
