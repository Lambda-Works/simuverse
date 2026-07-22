import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

export const LOGOS_DIR = join(process.cwd(), 'uploads', 'logos');
if (!existsSync(LOGOS_DIR)) {
  mkdirSync(LOGOS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB

export const logoUploadOptions = {
  storage: diskStorage({
    destination: LOGOS_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: MAX_LOGO_BYTES },
  fileFilter: (_req: any, file: Express.Multer.File, cb: (error: Error | null, accept: boolean) => void) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new BadRequestException('Solo se aceptan imágenes JPG, PNG o WebP'), false);
    }
    cb(null, true);
  },
};

/** File upload wins over a pasted URL. Falls back to the URL string (or undefined) otherwise. */
export function resolveLogoUrl(file: Express.Multer.File | undefined, logoUrl?: string): string | undefined {
  if (file) return `/logos/${file.filename}`;
  return logoUrl;
}

/** Deletes the on-disk file for a previous /logos/ path when it's about to be replaced or unset. */
export function cleanupOldLogo(previousLogoUrl: string | null | undefined) {
  if (!previousLogoUrl?.startsWith('/logos/')) return;
  const oldPath = join(LOGOS_DIR, previousLogoUrl.replace('/logos/', ''));
  if (existsSync(oldPath)) unlinkSync(oldPath);
}
