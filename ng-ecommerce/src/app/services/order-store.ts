import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItem, Customer, Order } from '../models/order';
import { loadJson, newId, saveJson } from '../utils/storage';
import { ProductStore } from './product-store';

const ORDERS_KEY = 'sp.orders';

/** Saved orders + the numbers shown on the dashboard. */
@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly products = inject(ProductStore);
  private readonly _orders = signal<Order[]>(loadJson<Order[]>(ORDERS_KEY, []));

  /** Newest first */
  readonly orders = this._orders.asReadonly();

  readonly totalOrders = computed(() => this._orders().length);
  readonly revenue = computed(() => this._orders().reduce((s, o) => s + o.total, 0));
  readonly itemsSold = computed(() => this._orders().reduce((s, o) => s + o.itemCount, 0));

  /**
   * Edits a saved order: customer details, quantities, and which items are kept.
   * Stock is given back / taken again to match the new quantities.
   */
  update(id: string, customer: Customer, edited: { productId: string; quantity: number }[]): Order | null {
    const old = this._orders().find((o) => o.id === id);
    if (!old) return null;

    const lines = old.lines
      .filter((l) => edited.some((e) => e.productId === l.productId))
      .map((l) => {
        const quantity = edited.find((e) => e.productId === l.productId)!.quantity;
        return { ...l, quantity, lineTotal: l.unitPrice * quantity };
      });
    if (!lines.length) return null;

    const updated: Order = {
      ...old,
      customer,
      lines,
      itemCount: lines.reduce((s, l) => s + l.quantity, 0),
      total: lines.reduce((s, l) => s + l.lineTotal, 0),
    };

    // stock change = what the order used to take minus what it takes now
    this.products.adjustStock(
      old.lines.map((l) => ({
        productId: l.productId,
        change: l.quantity - (lines.find((n) => n.productId === l.productId)?.quantity ?? 0),
      })),
    );

    this._orders.update((list) => list.map((o) => (o.id === id ? updated : o)));
    saveJson(ORDERS_KEY, this._orders());
    return updated;
  }

  /** Deletes an order and puts its items back into stock (like a cancelled order). */
  remove(id: string): void {
    const order = this._orders().find((o) => o.id === id);
    if (!order) return;
    this.products.adjustStock(order.lines.map((l) => ({ productId: l.productId, change: l.quantity })));
    this._orders.update((list) => list.filter((o) => o.id !== id));
    saveJson(ORDERS_KEY, this._orders());
  }

  /** Saves a new order built from the cart. */
  place(customer: Customer, items: CartItem[]): Order {
    const order: Order = {
      id: newId(),
      orderNo: 'ORD-' + String(this._orders().length + 1).padStart(4, '0'),
      createdAt: new Date().toISOString(),
      customer,
      lines: items.map((i) => ({
        productId: i.product.id,
        itemCode: i.product.itemCode,
        name: i.product.name,
        unitPrice: i.product.price,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      total: items.reduce((s, i) => s + i.lineTotal, 0),
    };
    this._orders.update((list) => [order, ...list]);
    saveJson(ORDERS_KEY, this._orders());
    return order;
  }
}
