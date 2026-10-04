import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'products',
  },
  {
    // Home page: all products + search + filters
    path: 'products',
    loadComponent: () => import('./pages/products-grid/products-grid'),
  },
  {
    // Single product details + add to cart
    path: 'products/:id',
    loadComponent: () => import('./pages/product-detail/product-detail'),
  },
  {
    path: 'add-product',
    loadComponent: () => import('./pages/add-product/add-product'),
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart'),
  },
  {
    // Dashboard > Products listed (manage products)
    path: 'dashboard/products',
    loadComponent: () => import('./pages/manage-products/manage-products'),
  },
  {
    // Edit / delete one product (same form as Add product)
    path: 'dashboard/products/:id',
    loadComponent: () => import('./pages/add-product/add-product'),
  },
  {
    // Edit a saved order
    path: 'dashboard/orders/:id',
    loadComponent: () => import('./pages/edit-order/edit-order'),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard'),
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./pages/my-wishlist/my-wishlist'),
  },
  {
    path: '**',
    redirectTo: 'products',
  },
];
