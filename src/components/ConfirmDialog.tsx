import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel, pending = false, tone = 'default', onConfirm, onClose }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [open]);
  if (!open) return null;
  return <dialog ref={dialogRef} role="alertdialog" onCancel={event => { event.preventDefault(); if (!pending) onClose(); }} aria-labelledby="confirm-title" aria-describedby="confirm-description" className="fixed inset-0 m-auto w-full max-w-lg border-0 bg-transparent p-4 text-white backdrop:bg-black/80 backdrop:backdrop-blur-sm">

    <section className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0a0a0a] p-6 text-right shadow-2xl">
      <button type="button" onClick={onClose} disabled={pending} className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-white/45 hover:bg-white/5 hover:text-white disabled:opacity-40" aria-label="ביטול וסגירה"><X size={18} /></button>
      <span className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-rose-500/10 text-rose-300' : 'bg-[#C8A24C]/10 text-[#C8A24C]'}`}><AlertTriangle size={21} /></span>
      <h2 id="confirm-title" className="mb-2 text-xl font-medium text-white">{title}</h2>
      <p id="confirm-description" className="text-sm font-light leading-relaxed text-white/50">{description}</p>
      <div className="mt-7 flex gap-3"><button autoFocus type="button" onClick={onConfirm} disabled={pending} className={`min-h-11 flex-1 rounded-xl px-5 text-sm font-medium disabled:opacity-50 ${tone === 'danger' ? 'bg-rose-400 text-black hover:bg-rose-300' : 'bg-[#C8A24C] text-black hover:bg-[#F7E7B5]'}`}>{pending ? 'מבצע…' : confirmLabel}</button><button type="button" onClick={onClose} disabled={pending} className="min-h-11 rounded-xl border border-white/15 px-5 text-sm text-white/70 hover:border-white/30 disabled:opacity-50">ביטול</button></div>
    </section>
  </dialog>;
}
