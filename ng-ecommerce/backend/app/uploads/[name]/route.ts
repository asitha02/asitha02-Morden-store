import { promises as fs } from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR } from '../../../lib/db';
import { TYPE_BY_EXT } from '../../../lib/images';

export const dynamic = 'force-dynamic';

/** GET /uploads/<file> – serves the product photos saved in data/uploads */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const file = path.basename(name);
  const type = TYPE_BY_EXT[path.extname(file).slice(1).toLowerCase()];
  if (!type) return new Response('Not found', { status: 404 });
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
