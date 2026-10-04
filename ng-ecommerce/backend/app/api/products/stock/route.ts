import { transaction } from '../../../../lib/db';
import { HttpError, handle, ok } from '../../../../lib/http';

export const dynamic = 'force-dynamic';

type Change = { productId: string; change: number };

/**
 * POST /api/products/stock  { changes: [{ productId, change }] }
 * change is negative when items are sold and positive when an order is edited or deleted.
 * All changes are applied together, or none if any product would go below 0.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const body = (await request.json().catch(() => null)) as { changes?: Change[] } | null;
    const changes = body?.changes;
    if (
      !Array.isArray(changes) ||
      changes.some((c) => typeof c?.productId !== 'string' || !Number.isInteger(c?.change))
    ) {
      throw new HttpError(400, 'Send { changes: [{ productId, change }] }');
    }

    const products = await transaction((db) => {
      const next = db.products.map((p) => ({ ...p }));
      for (const c of changes) {
        const product = next.find((p) => p.id === c.productId);
        if (!product) continue; // deleted meanwhile – nothing to change
        product.stock += c.change;
        if (product.stock < 0) {
          throw new HttpError(409, `Not enough stock for ${product.name}`);
        }
      }
      db.products = next;
      return next;
    });
    return ok({ products });
  });
}
