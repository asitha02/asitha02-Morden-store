import { Component, computed, inject, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { MoneyPipe } from '../../pipes/money';
import { ProductStore } from '../../services/product-store';

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

@Component({
  imports: [
    RouterLink,
    MatButton,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatIcon,
    MatInput,
    MoneyPipe,
  ],
  selector: 'app-manage-products',
  styles: ``,
  template: `
    <a routerLink="/dashboard" class="inline-flex items-center gap-1 text-sm text-slate-600 hover:underline mb-4">
      <mat-icon class="small">arrow_back</mat-icon> Back to dashboard
    </a>

    <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h1 class="text-2xl font-semibold">Products listed</h1>
      </div>
      <button matButton="filled" routerLink="/add-product">
        <mat-icon>add</mat-icon> Add product
      </button>
    </div>

    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div class="p-3 border-b border-slate-200">
        <mat-form-field appearance="outline">
          <mat-label>Search by name or item code</mat-label>
          <mat-icon matPrefix class="mx-2">search</mat-icon>
          <input matInput type="search" [value]="query()" (input)="query.set($any($event.target).value)" />
        </mat-form-field>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
              <th class="py-2 px-3 font-medium">Photo</th>
              <th class="py-2 px-3 font-medium">Item code</th>
              <th class="py-2 px-3 font-medium">Name</th>
              <th class="py-2 px-3 font-medium">Category</th>
              <th class="py-2 px-3 font-medium">Brand</th>
              <th class="py-2 px-3 font-medium">Vehicle</th>
              <th class="py-2 px-3 font-medium text-right">Price</th>
              <th class="py-2 px-3 font-medium text-right">Stock</th>
              <th class="py-2 px-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr
                class="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer"
                (click)="edit(p)"
              >
                <td class="py-2 px-3">
                  <div class="w-12 h-12 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
                    @if (p.images[0]) {
                      <img [src]="p.images[0]" [alt]="p.name" class="w-full h-full object-cover" />
                    } @else {
                      <mat-icon class="text-slate-300">build</mat-icon>
                    }
                  </div>
                </td>
                <td class="py-2 px-3 font-mono text-xs whitespace-nowrap">{{ p.itemCode }}</td>
                <td class="py-2 px-3 font-medium min-w-[160px]">{{ p.name }}</td>
                <td class="py-2 px-3">{{ p.category }}</td>
                <td class="py-2 px-3">{{ p.brand }}</td>
                <td class="py-2 px-3">{{ p.vehicleType }}</td>
                <td class="py-2 px-3 text-right whitespace-nowrap">{{ p.price | money }}</td>
                <td class="py-2 px-3 text-right" [class.text-red-600]="p.stock === 0">{{ p.stock }}</td>
                <td class="py-2 px-3 text-right whitespace-nowrap">
                  <button matIconButton aria-label="Edit" (click)="edit(p); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    matIconButton
                    class="danger"
                    aria-label="Delete"
                    (click)="remove(p); $event.stopPropagation()"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="p-8 text-center text-slate-500">
                  {{ store.products().length ? 'No products match your search.' : 'No products yet.' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export default class ManageProducts {
  protected readonly store = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly query = signal('');

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const qNorm = normalize(q);
    return this.store
      .products()
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.itemCode.toLowerCase().includes(q) ||
          (qNorm.length > 0 && normalize(p.itemCode).includes(qNorm)),
      );
  });

  protected edit(p: Product): void {
    this.router.navigate(['/dashboard/products', p.id]);
  }

  protected remove(p: Product): void {
    if (!confirm(`Delete "${p.name}" (${p.itemCode})? This cannot be undone.`)) return;
    this.store.remove(p.id);
    this.snack.open(`Deleted ${p.itemCode}`, 'OK', { duration: 3000 });
  }
}
