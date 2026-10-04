import type { NewProduct } from './types';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

/** Wraps a route so thrown HttpErrors become proper JSON error responses. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Checks the JSON sent by the Angular form. */
export function parseNewProduct(body: unknown): NewProduct {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Send the product as JSON');
  const b = body as Record<string, unknown>;

  const name = text(b['name']);
  const description = text(b['description']);
  const category = text(b['category']);
  const brand = text(b['brand']);
  const vehicleType = text(b['vehicleType']);
  const price = Number(b['price']);
  const stock = Number(b['stock']);
  const images = b['images'] ?? [];

  if (!name) throw new HttpError(400, 'Name is required');
  if (!description) throw new HttpError(400, 'Description is required');
  if (!category) throw new HttpError(400, 'Category is required');
  if (!brand) throw new HttpError(400, 'Brand is required');
  if (!vehicleType) throw new HttpError(400, 'Vehicle type is required');
  if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, 'Price must be above 0');
  if (!Number.isInteger(stock) || stock < 0) throw new HttpError(400, 'Stock must be a whole number');
  if (!Array.isArray(images) || images.some((i) => typeof i !== 'string')) {
    throw new HttpError(400, 'Images must be a list of strings');
  }
  if (images.length > 5) throw new HttpError(400, 'At most 5 photos per product');

  return { name, description, category, brand, vehicleType, price, stock, images: images as string[] };
}
