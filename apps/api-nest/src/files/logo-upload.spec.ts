import * as fs from 'fs';
import { join } from 'path';
import { LOGOS_DIR, logoUploadOptions, resolveLogoUrl, cleanupOldLogo } from './logo-upload';

describe('logo-upload', () => {
  describe('resolveLogoUrl', () => {
    it('prefers the uploaded file over a pasted URL', () => {
      const file = { filename: 'uuid.png' } as Express.Multer.File;
      expect(resolveLogoUrl(file, 'https://example.com/logo.png')).toBe('/logos/uuid.png');
    });

    it('falls back to the URL when there is no file', () => {
      expect(resolveLogoUrl(undefined, 'https://example.com/logo.png')).toBe('https://example.com/logo.png');
    });

    it('returns undefined when neither is provided', () => {
      expect(resolveLogoUrl(undefined, undefined)).toBeUndefined();
    });
  });

  describe('cleanupOldLogo', () => {
    // Real filesystem, no fs mocking — jest-mock can't re-spy Node's builtin
    // fs module properties reliably across cases in this repo's ts-jest setup.
    it('deletes the old file when it lives under /logos/', () => {
      const filePath = join(LOGOS_DIR, 'old-uuid.png');
      fs.writeFileSync(filePath, 'fake-image-bytes');

      cleanupOldLogo('/logos/old-uuid.png');

      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('does nothing for external URLs', () => {
      cleanupOldLogo('https://external.example.com/logo.png');
      // no throw, nothing under LOGOS_DIR touched — nothing to assert on disk
    });

    it('does nothing when there was no previous logo', () => {
      expect(() => cleanupOldLogo(undefined)).not.toThrow();
      expect(() => cleanupOldLogo(null)).not.toThrow();
    });

    it('does not throw when the old file is already gone from disk', () => {
      expect(() => cleanupOldLogo('/logos/never-existed.png')).not.toThrow();
    });
  });

  describe('logoUploadOptions.fileFilter', () => {
    const runFilter = (mimetype: string) =>
      new Promise<{ error: Error | null; accept: boolean }>((resolve) => {
        (logoUploadOptions.fileFilter as any)(
          {},
          { mimetype } as Express.Multer.File,
          (error: Error | null, accept: boolean) => resolve({ error, accept }),
        );
      });

    it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s', async (mimetype) => {
      const result = await runFilter(mimetype);
      expect(result.accept).toBe(true);
      expect(result.error).toBeNull();
    });

    it('rejects unsupported MIME types', async () => {
      const result = await runFilter('application/pdf');
      expect(result.accept).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('caps upload size at 5MB', () => {
      expect(logoUploadOptions.limits.fileSize).toBe(5 * 1024 * 1024);
    });
  });
});
