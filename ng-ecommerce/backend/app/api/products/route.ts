import { readDb, transaction } from '../../../lib/db';
import { handle, ok, parseNewProduct } from '../../../lib/http';
import { formatItemCode } from '../../../lib/catalog';
import { deleteImages, storeImages } from '../../../lib/images';
import type { Product } from '../../../lib/types';

export const dynamic = 'force-dynamic';

/** GET /api/products -> { counter, products } */
export async function GET() {
  return handle(async () => ok(await readDb()));
}

/** POST /api/products -> creates a product with a new unique item code */
export async function POST(request: Request) {
  return handle(async () => {
    const input = parseNewProduct(await request.json().catch(() => null));
    const images = await storeImages(input.images);
    try {
      const product = await transaction((db) => {
        const used = new Set(db.products.map((p) => p.itemCode));
        let code: string;
        do {
          db.counter++;
          code = formatItemCode(input.category, db.counter);
        } while (used.has(code));

        const created: Product = {
          ...input,
          images,
          id: crypto.randomUUID(),
          itemCode: code,
          createdAt: new Date().toISOString(),
        };
        db.products.unshift(created);
        return created;
      });
      return ok(product, 201);
    } catch (err) {
      await deleteImages(images);
      throw err;
    }
  });
}
