import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { path: pathSegments } = req.query;
  const segments = Array.isArray(pathSegments) ? pathSegments : [pathSegments];
  const filename = segments[segments.length - 1] || '';

  // Sanitize: only allow alphanumeric, hyphens, underscores, dots
  if (!filename || !/^[\w\-]+\.\w+$/.test(filename)) {
    return res.status(400).end();
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
  const resolved = path.resolve(filePath);

  // Path traversal protection
  if (!resolved.startsWith(path.join(process.cwd(), 'public', 'uploads'))) {
    return res.status(403).end();
  }

  if (!fs.existsSync(resolved)) {
    return res.status(404).end();
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const stream = fs.createReadStream(resolved);
  stream.pipe(res);
}
