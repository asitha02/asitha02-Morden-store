export type Product = {
  id: string;
  /** Unique, auto-generated, e.g. BRK-00012 */
  itemCode: string;
  name: string;
  description: string;
  price: number;
  /** URLs like /uploads/<file>.jpg */
  images: string[];
  category: string;
  brand: string;
  vehicleType: string;
  stock: number;
  createdAt: string;
};

/** What the Angular "Add product" form sends – id, itemCode and createdAt are made here. */
export type NewProduct = Omit<Product, 'id' | 'itemCode' | 'createdAt'>;

export type DbFile = {
  /** Last number used in an item code */
  counter: number;
  products: Product[];
};
