import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NewProduct, Product } from '../models/product';
import { categoryCode } from '../models/catalog';

/** The Next.js server (see /backend). In development `ng serve` forwards /api and /uploads to it (proxy.conf.json). */
const API = '/api/products';

type ListResponse = { counter: number; products: Product[] };

/**
 * Single source of truth for products. Products now live on the server, so every
 * computer sees the same list. Every page reads the same signal, so a product added on
 * the "Add product" page shows up on the home page immediately.
 */
@Injectable({ providedIn: 'root' })
export class ProductStore {
  private readonly http = inject(HttpClient);

  private readonly _products = signal<Product[]>([]);
  private readonly counter = signal(0);

  readonly products = this._products.asReadonly();
  /** true until the first answer from the server arrives */
  readonly loading = signal(true);
  /** set when the server can't be reached */
  readonly error = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  async reload(): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.get<ListResponse>(API));
      this._products.set(res.products);
      this.counter.set(res.counter);
      this.error.set(null);
    } catch {
      this.error.set('Cannot reach the server.');
    } finally {
      this.loading.set(false);
    }
  }

  /** The code the next product in this category will get (shown read-only on the form). */
  previewCode(category: string): string {
    return `${categoryCode(category)}-${String(this.counter() + 1).padStart(5, '0')}`;
  }

  /** Adds a product; the server creates the unique item code and saves the photos. Null if it failed. */
  async add(input: NewProduct): Promise<Product | null> {
    try {
      const product = await firstValueFrom(this.http.post<Product>(API, input));
      await this.reload(); // refreshes the list and the item-code counter
      return product;
    } catch {
      return null;
    }
  }

  /** Edits an existing product. The item code never changes. */
  async update(id: string, changes: NewProduct): Promise<boolean> {
    try {
      const updated = await firstValueFrom(this.http.put<Product>(`${API}/${id}`, changes));
      this._products.update((list) => list.map((p) => (p.id === id ? updated : p)));
      return true;
    } catch {
      return false;
    }
  }

  /** Deletes a product (and its photos). It also disappears from carts. */
  async remove(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${API}/${id}`));
      this._products.update((list) => list.filter((p) => p.id !== id));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Adds (+) or takes away (-) stock, e.g. when an order is placed, edited or deleted.
   * Returns false if the server refused (for example not enough stock).
   */
  async adjustStock(changes: { productId: string; change: number }[]): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ products: Product[] }>(`${API}/stock`, { changes }),
      );
      this._products.set(res.products);
      return true;
    } catch {
      return false;
    }
  }
}
