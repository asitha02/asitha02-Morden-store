import { readDb, transaction } from '../../../../lib/db';
import { HttpError, handle, ok, parseNewProduct } from '../../../../lib/http';
import { deleteImages, storeImages } from '../../../../lib/images';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/products/:id */
export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const product = (await readDb()).products.find((p) => p.id === id);
    if (!product) throw new HttpError(404, 'Product not found');
    return ok(product);
  });
}

/** PUT /api/products/:id -> edits a product (the item code never changes) */
export async function PUT(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const input = parseNewProduct(await request.json().catch(() => null));
    const images = await storeImages(input.images);

    let removed: string[] = [];
    try {
      const updated = await transaction((db) => {
        const index = db.products.findIndex((p) => p.id === id);
        if (index < 0) throw new HttpError(404, 'Product not found');
        const old = db.products[index];
        removed = old.images.filter((url) => !images.includes(url));
        db.products[index] = { ...old, ...input, images };
        return db.products[index];
      });
      await deleteImages(removed);
      return ok(updated);
    } catch (err) {
      await deleteImages(images);
      throw err;
    }
  });
}

/** DELETE /api/products/:id */
export async function DELETE(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const product = await transaction((db) => {
      const index = db.products.findIndex((p) => p.id === id);
      if (index < 0) throw new HttpError(404, 'Product not found');
      return db.products.splice(index, 1)[0];
    });
    await deleteImages(product.images);
    return ok({ deleted: id });
  });
}
