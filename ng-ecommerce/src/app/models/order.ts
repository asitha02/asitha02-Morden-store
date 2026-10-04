import { Product } from './product';

export type CartItem = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

export type Customer = {
  name: string;
  phone: string;
};

/** A snapshot of a purchased line – prices are frozen at the time of the order. */
export type OrderLine = {
  productId: string;
  itemCode: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNo: string;
  createdAt: string;
  customer: Customer;
  lines: OrderLine[];
  itemCount: number;
  total: number;
};
