import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { isS3Enabled, putS3Object, removeLocalCopy } from './s3Upload.js';
import { publicUploadOrigin } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');

export type UploadKind = 'image' | 'video' | 'resource' | 'caption';

const KINDS: Record<
  UploadKind,
  { maxBytes: number; mime: Record<string, string> }
> = {
  image: {
    maxBytes: 8 * 1024 * 1024,
    mime: {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    },
  },
  video: {
    maxBytes: 400 * 1024 * 1024,
    mime: {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
    },
  },
  resource: {
    maxBytes: 25 * 1024 * 1024,
    mime: {
      'application/pdf': '.pdf',
      'application/zip': '.zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    },
  },
  caption: {
    maxBytes: 2 * 1024 * 1024,
    mime: {
      'text/vtt': '.vtt',
      'application/octet-stream': '.vtt',
    },
  },
};

export function parseUploadKind(value: unknown): UploadKind {
  if (value === 'image' || value === 'video' || value === 'resource' || value === 'caption') return value;
  return 'image';
}

export function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function uploadMiddleware(kind: UploadKind) {
  ensureUploadsDir();
  const spec = KINDS[kind];
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
      filename: (_req, file, cb) => {
        const ext = spec.mime[file.mimetype] || '';
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: spec.maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!spec.mime[file.mimetype]) {
        cb(new Error('סוג קובץ לא נתמך'));
        return;
      }
      cb(null, true);
    },
  }).single('file');
}

export function publicUploadUrl(filename: string) {
  const origin = publicUploadOrigin();
  const path = `/uploads/${encodeURIComponent(filename)}`;
  return origin ? `${origin}${path}` : path;
}

export async function finalizeUploadedFile(file: { filename: string; path: string; mimetype: string }) {
  if (isS3Enabled()) {
    const key = `uploads/${file.filename}`;
    const url = await putS3Object(key, file.path, file.mimetype);
    await removeLocalCopy(file.path);
    return url;
  }
  return publicUploadUrl(file.filename);
}

export function multerMessage(err: unknown) {
  if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'LIMIT_FILE_SIZE') {
    return 'הקובץ גדול מדי';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'העלאה נכשלה';
}
