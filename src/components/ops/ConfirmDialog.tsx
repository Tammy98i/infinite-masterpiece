import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setRequest((prev) => {
        prev?.resolve(false);
        return { options, resolve };
      });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    setRequest((prev) => {
      prev?.resolve(value);
      return null;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request ? (
        <ConfirmDialog
          options={request.options}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = 'ops-confirm-title';
  const bodyId = 'ops-confirm-body';
  const confirmLabel = options.confirmLabel || 'אישור';
  const cancelLabel = options.cancelLabel || 'ביטול';

  useEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTarget = options.danger
      ? dialogRef.current?.querySelector<HTMLElement>('[data-confirm-cancel]')
      : dialogRef.current?.querySelector<HTMLElement>('[data-confirm-ok]');
    focusTarget?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
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
  }, [onCancel, options.danger]);

  const node = (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={options.body ? bodyId : undefined}
      dir="rtl"
    >
      <button type="button" className="absolute inset-0 bg-black/80" aria-label="סגירה" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-right shadow-2xl"
      >
        <h2 id={titleId} className="text-2xl font-medium text-white mb-4 leading-snug">
          {options.title}
        </h2>
        {options.body ? (
          <p id={bodyId} className="text-base text-white/70 font-light leading-relaxed mb-8">
            {options.body}
          </p>
        ) : (
          <div className="mb-8" />
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-start gap-3">
          <button
            type="button"
            data-confirm-ok
            onClick={onConfirm}
            className={`w-full sm:w-auto px-6 py-3 rounded-full text-base font-medium min-h-12 cursor-pointer ${
              options.danger
                ? 'border border-rose-400/50 text-rose-200 hover:bg-rose-500/10'
                : 'bg-[#C8A24C] text-black hover:bg-[#F7E7B5]'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            data-confirm-cancel
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/20 text-base text-white min-h-12 cursor-pointer hover:border-white/50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
