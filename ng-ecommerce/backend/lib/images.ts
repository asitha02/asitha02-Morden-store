import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR } from './db';
import { HttpError } from './http';

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const TYPE_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Turns the images sent by Angular into files:
 *  - "data:image/jpeg;base64,..." -> saved as a file, returns "/uploads/<name>.jpg"
 *  - "/uploads/<name>.jpg" (already saved) -> kept as it is
 */
export async function storeImages(images: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const img of images) {
    if (img.startsWith('/uploads/')) {
      out.push('/uploads/' + path.basename(img));
      continue;
    }
    const match = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/i.exec(img);
    const ext = match ? EXT_BY_TYPE[match[1].toLowerCase()] : undefined;
    if (!match || !ext) throw new HttpError(400, 'Photos must be JPEG, PNG, WebP or GIF');
    const name = `${randomUUID()}.${ext}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(match[2], 'base64'));
    out.push(`/uploads/${name}`);
  }
  return out;
}

export async function deleteImages(urls: string[]): Promise<void> {
  for (const url of urls) {
    if (!url.startsWith('/uploads/')) continue;
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => undefined);
  }
}
