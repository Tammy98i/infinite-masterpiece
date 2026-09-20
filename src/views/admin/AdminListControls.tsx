import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

export function AdminListControls({ query, onQueryChange, placeholder = 'חיפוש…', count, total, children }: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  count: number;
  total: number;
  children?: ReactNode;
}) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-center">
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      <input value={query} onChange={event => onQueryChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-xl border border-white/10 bg-[#0a0a0a] py-2.5 pe-10 ps-10 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#b79043]" />
      {query ? <button type="button" onClick={() => onQueryChange('')} className="absolute end-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-white/40 hover:text-white" aria-label="ניקוי חיפוש"><X size={15} /></button> : null}
    </label>
    {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    <p className="shrink-0 px-2 text-xs text-white/40" role="status">{count === total ? `${total} רשומות` : `${count} מתוך ${total}`}</p>
  </div>;
}
