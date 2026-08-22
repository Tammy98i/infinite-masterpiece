import React, { useEffect, useRef } from 'react';

interface AuthRequiredDialogProps {
  open: boolean;
  title?: string;
  body?: string;
  onClose: () => void;
  onLogin: () => void;
}

export function AuthRequiredDialog({
  open,
  title = 'נדרשת התחברות',
  body = 'כדי להמשיך בפעולה הזו צריך להתחבר לחשבון.',
  onClose,
  onLogin,
}: AuthRequiredDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = dialogRef.current?.querySelector<HTMLElement>('button');
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      triggerRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="auth-required-title">
      <button type="button" className="absolute inset-0 bg-black/75" aria-label="סגירה" onClick={onClose} />
      <div ref={dialogRef} className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-right">
        <h2 id="auth-required-title" className="text-2xl font-medium text-white mb-4">
          {title}
        </h2>
        <p className="text-sm text-white/55 font-light leading-relaxed mb-8">{body}</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onLogin}
            className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 hover:bg-[#F7E7B5]"
          >
            התחברות
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-sm text-white/50 hover:text-white min-h-11"
          >
            חזרה
          </button>
        </div>
      </div>
    </div>
  );
}
