// Copies products (and their photos) exported from the old browser-only version into this server.
//
//   npm run import -- path/to/sp-export.json
//
// The export file looks like { "products": [...], "counter": 8 } (see README.md for how to make it).
// This REPLACES the products in data/db.json and writes the photos into data/uploads/.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run import -- path/to/sp-export.json');
  process.exit(1);
}

const dataDir = path.join(process.cwd(), 'data');
const uploadDir = path.join(dataDir, 'uploads');
await mkdir(uploadDir, { recursive: true });

const exported = JSON.parse(await readFile(file, 'utf8'));
const source = Array.isArray(exported) ? exported : exported.products;
if (!Array.isArray(source)) {
  console.error('That file has no "products" list.');
  process.exit(1);
}

async function saveImage(img) {
  if (img.startsWith('/uploads/')) return img;
  const m = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(img);
  const ext = m && EXT[m[1].toLowerCase()];
  if (!ext) return null;
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(uploadDir, name), Buffer.from(m[2], 'base64'));
  return `/uploads/${name}`;
}

let counter = Number(exported.counter) || 0;
const products = [];
let photos = 0;

for (const p of source) {
  const rawImages = Array.isArray(p.images) ? p.images : p.imageUrl ? [p.imageUrl] : [];
  const images = [];
  for (const img of rawImages) {
    const saved = await saveImage(img);
    if (saved) {
      images.push(saved);
      photos++;
    }
  }
  const n = Number(/-(\d+)$/.exec(p.itemCode ?? '')?.[1]);
  if (n > counter) counter = n;

  products.push({
    id: p.id,
    itemCode: p.itemCode,
    name: p.name,
    description: p.description,
    price: p.price,
    images,
    category: p.category,
    brand: p.brand,
    vehicleType: p.vehicleType,
    stock: p.stock ?? 0,
    createdAt: p.createdAt ?? new Date().toISOString(),
  });
}

await writeFile(path.join(dataDir, 'db.json'), JSON.stringify({ counter, products }, null, 2));
console.log(`Imported ${products.length} products and ${photos} photos into data/`);
