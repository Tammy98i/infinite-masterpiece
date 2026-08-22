import { useRef, useState } from 'react';
import { uploadFile, type UploadKind } from '../api/upload';

const ACCEPT: Record<UploadKind, string> = {
  image: 'image/jpeg,image/png,image/webp',
  video: 'video/mp4,video/webm,video/quicktime',
  resource: '.pdf,.zip,.docx,application/pdf,application/zip',
  caption: '.vtt,text/vtt',
};

interface FileUploadFieldProps {
  kind: UploadKind;
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  hidePreview?: boolean;
  /** Alt text for image preview (accessibility). */
  previewAlt?: string;
}

export function FileUploadField({ kind, label, value, onChange, disabled, hidePreview, previewAlt }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await uploadFile(file, kind));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'העלאה נכשלה');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="block">
      <span className="block text-xs text-white/45 mb-1">{label}</span>
      {kind === 'image' && value && !hidePreview ? (
        <img
          src={value}
          alt={previewAlt || 'תצוגה מקדימה של תמונה שהועלתה'}
          className="w-full max-h-40 object-cover rounded-xl border border-white/10 mb-3"
        />
      ) : null}
      {value && kind !== 'image' ? (
        <p className="text-xs text-white/40 truncate mb-2">{decodeURIComponent(value.split('/').pop() || value)}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <label className={`inline-flex items-center px-5 py-2 rounded-full border border-white/15 text-sm min-h-11 ${disabled || busy ? 'opacity-60' : 'cursor-pointer hover:border-white/40'}`}>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT[kind]}
            disabled={disabled || busy}
            className="sr-only"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          {busy ? 'מעלה...' : 'בחירת קובץ'}
        </label>
        {value ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => onChange('')}
            className="text-sm text-white/40 hover:text-white min-h-11 cursor-pointer"
          >
            הסרה
          </button>
        ) : null}
      </div>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="או קישור"
        className="mt-3 w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11"
      />
      {error ? <p className="text-sm text-rose-300 mt-2">{error}</p> : null}
    </div>
  );
}
