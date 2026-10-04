import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { BRANDS, CATEGORY_NAMES, VEHICLE_TYPES } from '../../models/catalog';
import { NewProduct } from '../../models/product';
import { ProductStore } from '../../services/product-store';
import { shrinkImage } from '../../utils/image';

@Component({
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatFormField,
    MatLabel,
    MatError,
      MatSuffix,
    MatIcon,
    MatInput,
    MatSelect,
    MatOption,
    RouterLink,
  ],
  selector: 'app-add-product',
  styles: ``,
  template: `
    <div class="max-w-3xl mx-auto">
      <a [routerLink]="backLink()" class="inline-flex items-center gap-1 text-sm text-slate-600 hover:underline mb-4">
        <mat-icon class="small">arrow_back</mat-icon>
        {{ id() ? 'Back to products listed' : 'Back to all parts' }}
      </a>
      <h1 class="text-2xl font-semibold mb-5">{{ id() ? 'Edit product' : 'Add product' }}</h1>

      @if (id() && !existing()) {
        <div class="text-center bg-white border border-slate-200 rounded-xl p-10">
          <mat-icon class="!w-12 !h-12 !text-5xl text-slate-300">error_outline</mat-icon>
          <p class="font-medium mt-2">Product not found</p>
          <p class="text-slate-500 mb-4">It may have been deleted.</p>
          <button matButton="filled" routerLink="/dashboard/products">Back to products listed</button>
        </div>
      } @else {
      <form
        [formGroup]="form"
        (ngSubmit)="submit(false)"
        class="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 grid gap-x-4 gap-y-2 sm:grid-cols-2"
      >
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>{{ id() ? 'Item code' : 'Item code (auto-generated)' }}</mat-label>
          <input matInput [value]="nextCode()" readonly />
          <mat-icon matSuffix class="mx-2">tag</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Product name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Front Brake Pad Set" />
          <mat-error>{{ errorText('name') }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            @for (c of categories; track c) {
              <mat-option [value]="c">{{ c }}</mat-option>
            }
          </mat-select>
          <mat-error>{{ errorText('category') }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Brand</mat-label>
          <mat-select formControlName="brand">
            @for (b of brands; track b) {
              <mat-option [value]="b">{{ b }}</mat-option>
            }
          </mat-select>
          <mat-error>{{ errorText('brand') }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Vehicle type</mat-label>
          <mat-select formControlName="vehicleType">
            @for (v of vehicleTypes; track v) {
              <mat-option [value]="v">{{ v }}</mat-option>
            }
          </mat-select>
          <mat-error>{{ errorText('vehicleType') }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            rows="4"
            formControlName="description"
            placeholder="What is it, what does it fit, any useful details"
          ></textarea>
          <mat-error>{{ errorText('description') }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Price (Rs.)</mat-label>
          <input matInput type="number" min="0" step="0.01" formControlName="price" />
          <mat-error>{{ errorText('price') }}</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Stock quantity</mat-label>
          <input matInput type="number" min="0" step="1" formControlName="stock" />
          <mat-error>{{ errorText('stock') }}</mat-error>
        </mat-form-field>

        <!-- Photos (up to 5) -->
        <div class="sm:col-span-2 mb-2">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-sm">
              Photos <span class="text-slate-500 font-normal">(optional, up to {{ maxImages }})</span>
            </span>
            <span class="text-xs text-slate-500">{{ images().length }} / {{ maxImages }}</span>
          </div>

          <div class="flex flex-wrap gap-3">
            @for (img of images(); track $index) {
              <div class="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img [src]="img" alt="Preview" class="w-full h-full object-cover" />
                @if ($index === 0) {
                  <span class="absolute bottom-0 inset-x-0 text-center text-[10px] bg-black/60 text-white">Main</span>
                }
                <button
                  type="button"
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center"
                  aria-label="Remove photo"
                  (click)="removeImage($index)"
                >
                  <mat-icon class="small">close</mat-icon>
                </button>
              </div>
            }

            @if (images().length < maxImages) {
              <input #file type="file" accept="image/*" multiple class="hidden" (change)="onFiles($event)" />
              <button
                type="button"
                class="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 flex flex-col items-center justify-center hover:bg-slate-50"
                (click)="file.click()"
              >
                <mat-icon>add_photo_alternate</mat-icon>
                <span class="text-xs">Add photos</span>
              </button>
            }
          </div>
        </div>

        <div class="sm:col-span-2 flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-200">
          <button matButton type="button" [routerLink]="backLink()">Cancel</button>
          @if (existing()) {
            <button matButton type="button" class="danger" (click)="deleteProduct()">
              <mat-icon>delete</mat-icon> Delete
            </button>
            <button matButton="filled" type="submit">Save changes</button>
          } @else {
            <button matButton type="button" (click)="submit(true)">Save &amp; add another</button>
            <button matButton="filled" type="submit">Save product</button>
          }
        </div>
      </form>
      }
    </div>
  `,
})
export default class AddProduct {
  /** Set when the page is opened as /dashboard/products/:id – then it edits that product. */
  readonly id = input<string>();

  private readonly store = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly categories = CATEGORY_NAMES;
  protected readonly brands = BRANDS;
  protected readonly vehicleTypes = VEHICLE_TYPES;

  protected readonly maxImages = 5;
  protected readonly images = signal<string[]>([]);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', Validators.required],
    brand: ['', Validators.required],
    vehicleType: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    stock: this.fb.control<number | null>(1, [
      Validators.required,
      Validators.min(0),
      Validators.pattern(/^\d+$/),
    ]),
  });

  protected readonly existing = computed(() => {
    const id = this.id();
    return id ? this.store.products().find((p) => p.id === id) : undefined;
  });

  protected readonly backLink = computed(() => (this.id() ? '/dashboard/products' : '/products'));

  private loadedId: string | null = null;

  constructor() {
    // Fill the form once with the product being edited.
    effect(() => {
      const p = this.existing();
      if (!p || p.id === this.loadedId) return;
      this.loadedId = p.id;
      untracked(() => {
        this.form.reset({
          name: p.name,
          category: p.category,
          brand: p.brand,
          vehicleType: p.vehicleType,
          description: p.description,
          price: p.price,
          stock: p.stock,
        });
        this.images.set([...p.images]);
      });
    });
  }

  private readonly selectedCategory = toSignal(this.form.controls.category.valueChanges, {
    initialValue: '',
  });

  /** Live preview of the code this product will receive. */
  protected readonly nextCode = computed(() => {
    const existing = this.existing();
    if (existing) return existing.itemCode;
    const category = this.selectedCategory();
    return category ? this.store.previewCode(category) : 'Choose a category to see the code';
  });

  protected errorText(name: string): string {
    const c: AbstractControl | null = this.form.get(name);
    if (!c) return '';
    if (c.hasError('required')) return 'This field is required';
    if (c.hasError('minlength')) {
      return `Enter at least ${c.errors?.['minlength'].requiredLength} characters`;
    }
    if (c.hasError('min')) return `Must be at least ${c.errors?.['min'].min}`;
    if (c.hasError('pattern')) return 'Enter a whole number';
    return '';
  }

  protected async onFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const room = this.maxImages - this.images().length;
    try {
      const added = await Promise.all(files.slice(0, room).map((f) => shrinkImage(f)));
      this.images.update((list) => [...list, ...added]);
      if (files.length > room) {
        this.snack.open(`Only ${this.maxImages} photos allowed per item`, 'OK', { duration: 3000 });
      }
    } catch (err) {
      this.snack.open(err instanceof Error ? err.message : 'Could not read that image', 'OK', {
        duration: 3000,
      });
    }
    input.value = '';
  }

  protected removeImage(index: number): void {
    this.images.update((list) => list.filter((_, i) => i !== index));
  }

  protected deleteProduct(): void {
    const p = this.existing();
    if (!p) return;
    if (!confirm(`Delete "${p.name}" (${p.itemCode})? This cannot be undone.`)) return;
    this.store.remove(p.id);
    this.snack.open(`Deleted ${p.itemCode}`, 'OK', { duration: 3000 });
    this.router.navigateByUrl('/dashboard/products');
  }

  protected submit(addAnother: boolean): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Please fix the highlighted fields', 'OK', { duration: 3000 });
      return;
    }

    const v = this.form.getRawValue();
    const data: NewProduct = {
      name: v.name.trim(),
      description: v.description.trim(),
      category: v.category,
      brand: v.brand,
      vehicleType: v.vehicleType,
      price: Number(v.price),
      stock: Number(v.stock),
      images: this.images(),
    };

    const existing = this.existing();
    if (existing) {
      if (!this.store.update(existing.id, data)) {
        this.snack.open('Could not save – browser storage is full. Try fewer or smaller photos.', 'OK', {
          duration: 5000,
        });
        return;
      }
      this.snack.open(`Saved changes to "${data.name}"`, 'OK', { duration: 3000 });
      this.router.navigateByUrl('/dashboard/products');
      return;
    }

    const product = this.store.add(data);

    if (!product) {
      this.snack.open('Could not save – browser storage is full. Try fewer or smaller photos.', 'OK', {
        duration: 5000,
      });
      return;
    }

    this.snack.open(`Added "${product.name}" with item code ${product.itemCode}`, 'OK', {
      duration: 4000,
    });

    if (addAnother) {
      this.form.reset({ stock: 1 });
      this.images.set([]);
    } else {
      this.router.navigateByUrl('/products');
    }
  }
}
