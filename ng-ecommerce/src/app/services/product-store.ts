import { Injectable, signal } from '@angular/core';
import { categoryCode } from '../models/catalog';
import { NewProduct, Product } from '../models/product';
import { loadJson, newId, saveJson } from '../utils/storage';

const PRODUCTS_KEY = 'sp.products';
const COUNTER_KEY = 'sp.itemCounter';

/**
 * Demo products shown the first time the app opens (so the home page isn't empty).
 * Delete this list (leave `[]`) if you want to start with no products.
 */
const SEED: NewProduct[] = [
  {
    name: 'Front Brake Pad Set',
    description: 'Low-dust ceramic brake pads for front axle. Quiet, long-lasting stopping power.',
    price: 8500,
    images: [],
    category: 'Brakes',
    brand: 'Brembo',
    vehicleType: 'Car',
    stock: 12,
  },
  {
    name: 'Oil Filter',
    description: 'High-flow spin-on oil filter with anti-drain back valve. Fits most 1.0–1.8L petrol engines.',
    price: 1450,
    images: [],
    category: 'Filters',
    brand: 'Bosch',
    vehicleType: 'Car',
    stock: 40,
  },
  {
    name: 'Iridium Spark Plug',
    description: 'Long-life iridium spark plug for better ignition and fuel economy.',
    price: 1850,
    images: [],
    category: 'Engine',
    brand: 'NGK',
    vehicleType: 'Car',
    stock: 60,
  },
  {
    name: 'Front Shock Absorber',
    description: 'Gas-charged front shock absorber for a smooth, stable ride on rough roads.',
    price: 12500,
    images: [],
    category: 'Suspension & Steering',
    brand: 'KYB',
    vehicleType: 'SUV / Jeep',
    stock: 8,
  },
  {
    name: 'Headlight Bulb H4 12V',
    description: 'Bright halogen H4 headlight bulb, 60/55W. Sold individually.',
    price: 950,
    images: [],
    category: 'Lighting',
    brand: 'Philips',
    vehicleType: 'Car',
    stock: 25,
  },
  {
    name: 'Clutch Plate Kit',
    description: 'Complete clutch kit: pressure plate, clutch disc and release bearing.',
    price: 18500,
    images: [],
    category: 'Transmission & Clutch',
    brand: 'Valeo',
    vehicleType: 'Van',
    stock: 5,
  },
  {
    name: 'Engine Oil 5W-30 (4L)',
    description: 'Fully synthetic engine oil for modern petrol and diesel engines.',
    price: 9800,
    images: [],
    category: 'Oils & Fluids',
    brand: 'Castrol',
    vehicleType: 'Car',
    stock: 30,
  },
  {
    name: 'Drum Brake Shoe Set',
    description: 'Rear drum brake shoes for three-wheelers. Pair.',
    price: 2200,
    images: [],
    category: 'Brakes',
    brand: 'Other / Generic',
    vehicleType: 'Three-wheeler',
    stock: 0,
  },
];

/**
 * Single source of truth for products. Every page reads the same signal, so a product
 * added on the "Add product" page shows up on the home page immediately.
 */
@Injectable({ providedIn: 'root' })
export class ProductStore {
  private readonly _products = signal<Product[]>([]);
  private readonly counter = signal(0);

  readonly products = this._products.asReadonly();

  constructor() {
    const saved = loadJson<Product[] | null>(PRODUCTS_KEY, null);
    if (saved) {
      // older saved data had a single `imageUrl` – convert it to the new `images` list
      this._products.set(
        saved.map((p) => {
          const old = (p as Product & { imageUrl?: string }).imageUrl;
          return p.images ? p : { ...p, images: old ? [old] : [] };
        }),
      );
      this.counter.set(loadJson<number>(COUNTER_KEY, saved.length));
    } else {
      this.seed();
    }
  }

  /** The code the next product in this category will get (shown read-only on the form). */
  previewCode(category: string): string {
    return this.format(category, this.counter() + 1);
  }

  /** Adds a product with a brand-new unique item code. Returns null if the browser storage is full. */
  add(input: NewProduct): Product | null {
    const used = new Set(this._products().map((p) => p.itemCode));
    let n = this.counter();
    let code: string;
    do {
      n++;
      code = this.format(input.category, n);
    } while (used.has(code));

    const product: Product = {
      ...input,
      id: newId(),
      itemCode: code,
      createdAt: new Date().toISOString(),
    };

    const before = this._products();
    const counterBefore = this.counter();
    this._products.set([product, ...before]);
    this.counter.set(n);

    if (!this.persist()) {
      // roll back so the UI never shows something that wasn't saved
      this._products.set(before);
      this.counter.set(counterBefore);
      return null;
    }
    return product;
  }

  /** Edits an existing product. The item code never changes. Returns false if storage is full. */
  update(id: string, changes: NewProduct): boolean {
    const before = this._products();
    this._products.set(before.map((p) => (p.id === id ? { ...p, ...changes } : p)));
    if (!this.persist()) {
      this._products.set(before);
      return false;
    }
    return true;
  }

  /** Deletes a product. It also disappears from carts; past orders keep their own copy of the details. */
  remove(id: string): void {
    this._products.update((list) => list.filter((p) => p.id !== id));
    this.persist();
  }

  /** Adds (+) or takes away (-) stock, e.g. when an existing order is edited. */
  adjustStock(changes: { productId: string; change: number }[]): void {
    this._products.update((list) =>
      list.map((p) => {
        const c = changes.find((x) => x.productId === p.id);
        return c ? { ...p, stock: Math.max(0, p.stock + c.change) } : p;
      }),
    );
    this.persist();
  }

  private seed(): void {
    let n = 0;
    const products: Product[] = SEED.map((p, i) => {
      n++;
      return {
        ...p,
        id: newId() + i,
        itemCode: this.format(p.category, n),
        // older first, so the last seed item is "oldest"
        createdAt: new Date(Date.now() - i * 60_000).toISOString(),
      };
    });
    this._products.set(products);
    this.counter.set(n);
    this.persist();
  }

  private format(category: string, n: number): string {
    return `${categoryCode(category)}-${String(n).padStart(5, '0')}`;
  }

  private persist(): boolean {
    const a = saveJson(PRODUCTS_KEY, this._products());
    const b = saveJson(COUNTER_KEY, this.counter());
    return a && b;
  }
}
