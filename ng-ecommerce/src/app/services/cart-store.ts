import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CartItem, Customer, Order } from '../models/order';
import { Product } from '../models/product';
import { loadJson, saveJson } from '../utils/storage';
import { OrderStore } from './order-store';
import { ProductStore } from './product-store';

const CART_KEY = 'sp.cart';

type CartLine = { productId: string; quantity: number };

/** The shopping cart. Header badge and cart page both read these signals, so they update in real time. */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly products = inject(ProductStore);
  private readonly orders = inject(OrderStore);

  private readonly lines = signal<CartLine[]>(loadJson<CartLine[]>(CART_KEY, []));

  /** Cart lines joined with the live product data (price, stock …). */
  readonly items = computed<CartItem[]>(() => {
    const out: CartItem[] = [];
    for (const line of this.lines()) {
      const product = this.products.products().find((p) => p.id === line.productId);
      if (!product) continue;
      const quantity = Math.min(line.quantity, product.stock);
      if (quantity < 1) continue;
      out.push({ product, quantity, lineTotal: product.price * quantity });
    }
    return out;
  });

  readonly count = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  readonly total = computed(() => this.items().reduce((s, i) => s + i.lineTotal, 0));

  constructor() {
    effect(() => {
      saveJson(CART_KEY, this.lines());
    });
  }

  quantityOf(productId: string): number {
    return this.items().find((i) => i.product.id === productId)?.quantity ?? 0;
  }

  /** 'added' | 'max' (limited by stock) | 'out' (no stock) */
  add(product: Product, quantity = 1): 'added' | 'max' | 'out' {
    if (product.stock < 1) return 'out';
    const current = this.quantityOf(product.id);
    const wanted = current + quantity;
    const next = Math.min(wanted, product.stock);
    this.setLine(product.id, next);
    return next < wanted ? 'max' : 'added';
  }

  setQuantity(product: Product, quantity: number): void {
    const next = Math.max(1, Math.min(Math.floor(quantity) || 1, product.stock));
    this.setLine(product.id, next);
  }

  remove(productId: string): void {
    this.lines.update((l) => l.filter((x) => x.productId !== productId));
  }

  clear(): void {
    this.lines.set([]);
  }

  /** Saves the cart as an order (shown on the dashboard), reduces stock and empties the cart. */
  checkout(customer: Customer): Order | null {
    const items = this.items();
    if (!items.length) return null;
    const order = this.orders.place(customer, items);
    this.products.adjustStock(items.map((i) => ({ productId: i.product.id, change: -i.quantity })));
    this.clear();
    return order;
  }

  private setLine(productId: string, quantity: number): void {
    this.lines.update((lines) =>
      lines.some((l) => l.productId === productId)
        ? lines.map((l) => (l.productId === productId ? { ...l, quantity } : l))
        : [...lines, { productId, quantity }],
    );
  }
}
