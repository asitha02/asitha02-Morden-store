import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { BRANDS, CATEGORY_NAMES, VEHICLE_TYPES } from '../../models/catalog';
import { ProductCard } from '../../components/product-card/product-card';
import { ProductStore } from '../../services/product-store';

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'name';

/** Strips spaces, dashes etc. so "brk 00001" still finds "BRK-00001". */
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

@Component({
  imports: [
    MatButton,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatIcon,
    MatInput,
    MatSelect,
    MatOption,
    RouterLink,
    ProductCard,
  ],
  selector: 'app-products-grid',
  styles: ``,
  template: `
    <!-- Search + filters -->
    <div class="bg-white border border-slate-200 rounded-xl p-4 mb-5">
      <mat-form-field appearance="outline">
        <mat-label>Search by name, description or item code</mat-label>
        <mat-icon matPrefix class="mx-2">search</mat-icon>
        <input
          matInput
          type="search"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
          placeholder="e.g. brake pad, filter, BRK-00001"
        />
        @if (query()) {
          <button matSuffix class="mr-2" aria-label="Clear search" (click)="query.set('')">
            <mat-icon class="small">close</mat-icon>
          </button>
        }
      </mat-form-field>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [value]="category()" (selectionChange)="category.set($event.value)">
            <mat-option value="">All categories</mat-option>
            @for (c of categories; track c) {
              <mat-option [value]="c">{{ c }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Brand</mat-label>
          <mat-select [value]="brand()" (selectionChange)="brand.set($event.value)">
            <mat-option value="">All brands</mat-option>
            @for (b of brands; track b) {
              <mat-option [value]="b">{{ b }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Vehicle type</mat-label>
          <mat-select [value]="vehicleType()" (selectionChange)="vehicleType.set($event.value)">
            <mat-option value="">All vehicle types</mat-option>
            @for (v of vehicleTypes; track v) {
              <mat-option [value]="v">{{ v }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sort by</mat-label>
          <mat-select [value]="sort()" (selectionChange)="sort.set($event.value)">
            <mat-option value="newest">Newest first</mat-option>
            <mat-option value="price-asc">Price: low to high</mat-option>
            <mat-option value="price-desc">Price: high to low</mat-option>
            <mat-option value="name">Name A–Z</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 mt-3">
        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            [checked]="inStockOnly()"
            (change)="inStockOnly.set($any($event.target).checked)"
          />
          In stock only
        </label>
        @if (hasFilters()) {
          <button matButton (click)="clearFilters()">Clear all filters</button>
        }
      </div>
    </div>

    <!-- Results -->
    @if (store.products().length === 0) {
      <div class="text-center bg-white border border-dashed border-slate-300 rounded-xl p-10">
        <mat-icon class="!w-12 !h-12 !text-5xl text-slate-300">inventory_2</mat-icon>
        <p class="font-medium mt-2">No products yet</p>
        <p class="text-slate-500 mb-4">Add your first spare part and it will appear here.</p>
        <button matButton="filled" routerLink="/add-product">Add product</button>
      </div>
    } @else {
      <p class="text-sm text-slate-500 mb-3">
        Showing {{ filtered().length }} of {{ store.products().length }} parts
      </p>

      @if (filtered().length === 0) {
        <div class="text-center bg-white border border-slate-200 rounded-xl p-10">
          <mat-icon class="!w-12 !h-12 !text-5xl text-slate-300">search_off</mat-icon>
          <p class="font-medium mt-2">No parts match your search</p>
          <p class="text-slate-500 mb-4">Try a different keyword or clear the filters.</p>
          <button matButton="filled" (click)="clearFilters()">Clear all filters</button>
        </div>
      } @else {
        <div class="responsive-grid">
          @for (p of filtered(); track p.id) {
            <app-product-card [product]="p" />
          }
        </div>
      }
    }
  `,
})
export default class ProductsGrid {
  protected readonly store = inject(ProductStore);

  protected readonly categories = CATEGORY_NAMES;
  protected readonly brands = BRANDS;
  protected readonly vehicleTypes = VEHICLE_TYPES;

  protected readonly query = signal('');
  protected readonly category = signal('');
  protected readonly brand = signal('');
  protected readonly vehicleType = signal('');
  protected readonly sort = signal<SortKey>('newest');
  protected readonly inStockOnly = signal(false);

  protected readonly hasFilters = computed(
    () =>
      !!this.query().trim() ||
      !!this.category() ||
      !!this.brand() ||
      !!this.vehicleType() ||
      this.inStockOnly(),
  );

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const qNorm = normalize(q);
    const category = this.category();
    const brand = this.brand();
    const vehicleType = this.vehicleType();
    const inStockOnly = this.inStockOnly();

    const list = this.store.products().filter((p) => {
      if (category && p.category !== category) return false;
      if (brand && p.brand !== brand) return false;
      if (vehicleType && p.vehicleType !== vehicleType) return false;
      if (inStockOnly && p.stock < 1) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.itemCode.toLowerCase().includes(q) ||
        (qNorm.length > 0 && normalize(p.itemCode).includes(qNorm))
      );
    });

    switch (this.sort()) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      case 'name':
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  });

  protected clearFilters(): void {
    this.query.set('');
    this.category.set('');
    this.brand.set('');
    this.vehicleType.set('');
    this.inStockOnly.set(false);
  }
}
