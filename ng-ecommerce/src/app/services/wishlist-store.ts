import { Injectable, computed, effect, signal } from '@angular/core';
import { loadJson, saveJson } from '../utils/storage';

const WISHLIST_KEY = 'sp.wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private readonly ids = signal<string[]>(loadJson<string[]>(WISHLIST_KEY, []));

  readonly all = this.ids.asReadonly();
  readonly count = computed(() => this.ids().length);

  constructor() {
    effect(() => {
      saveJson(WISHLIST_KEY, this.ids());
    });
  }

  has(id: string): boolean {
    return this.ids().includes(id);
  }

  toggle(id: string): void {
    this.ids.update((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }
}
