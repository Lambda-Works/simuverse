'use client'
import { Link as LinkIcon, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LogoFieldProps {
  urlValue: string;
  onUrlChange: (value: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  label?: string;
}

/** URL/upload toggle for logo fields — file wins over URL when both are set. */
export function LogoField({ urlValue, onUrlChange, file, onFileChange, label = 'Logo' }: LogoFieldProps) {
  const [mode, setMode] = useState<'url' | 'file'>(file ? 'file' : 'url');

  const switchMode = (next: 'url' | 'file') => {
    if (next === mode) return;
    setMode(next);
    if (next === 'url') onFileChange(null);
    else onUrlChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label} <span className="text-xs text-gray-400">(opcional)</span></Label>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => switchMode('url')}
            className={`px-2 py-0.5 rounded flex items-center ${mode === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <LinkIcon className="w-3 h-3 mr-1" />URL
          </button>
          <button
            type="button"
            onClick={() => switchMode('file')}
            className={`px-2 py-0.5 rounded flex items-center ${mode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <Upload className="w-3 h-3 mr-1" />Subir archivo
          </button>
        </div>
      </div>
      {mode === 'url' ? (
        <Input key="url" value={urlValue} onChange={e => onUrlChange(e.target.value)} placeholder="https://.../logo.png" />
      ) : (
        <Input
          key="file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={e => onFileChange(e.target.files?.[0] ?? null)}
        />
      )}
    </div>
  );
}

/** Object URL preview for a locally-picked file, revoked automatically on change/unmount. */
export function useFilePreview(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}
