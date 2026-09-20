import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Search, X } from 'lucide-react';
import { NAV_ITEMS, TAB_META, type Tab } from './adminNav';

export function AdminCommandPalette({ open, recent, onClose, onNavigate }: {
  open: boolean;
  recent: Tab[];
  onClose: () => void;
  onNavigate: (tab: Tab) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setQuery('');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_ITEMS.filter(item => `${item.label} ${item.id} ${item.keywords || ''} ${TAB_META[item.id].description}`.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);
  if (!open) return null;
  const navigate = (tab: Tab) => { onNavigate(tab); onClose(); };
  return <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]" role="presentation">
    <button type="button" className="absolute inset-0 bg-black/75 backdrop-blur-sm" aria-label="סגירת מעבר מהיר" onClick={onClose} />
    <section role="dialog" aria-modal="true" aria-labelledby="admin-search-title" className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#b79043]/30 bg-[#080808] shadow-2xl">
      <h2 id="admin-search-title" className="sr-only">מעבר מהיר באדמין</h2>
      <div className="flex items-center gap-3 border-b border-white/10 px-5">
        <Search className="h-5 w-5 text-[#b79043]" aria-hidden />
        <input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') onClose(); if (event.key === 'Enter' && results[0]) navigate(results[0].id); }} placeholder="חיפוש מסך, פעולה או תחום…" className="min-h-16 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35" />
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-white/50 hover:bg-white/5 hover:text-white" aria-label="סגירה"><X size={18} /></button>
      </div>
      <div className="max-h-[55vh] overflow-y-auto p-3">
        {!query && recent.length > 0 ? <div><p className="flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[.18em] text-white/35"><Clock3 size={14} />אחרונים</p>{recent.map(tab => <div key={tab}><ResultButton tab={tab} onClick={() => navigate(tab)} /></div>)}</div> : null}
        {query && results.length === 0 ? <p className="px-4 py-10 text-center text-sm text-white/45">לא נמצא מסך מתאים. נסו שם אחר או תחום פעולה.</p> : null}
        {results.map(item => <div key={item.id}><ResultButton tab={item.id} onClick={() => navigate(item.id)} /></div>)}
      </div>
      <footer className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[11px] text-white/35"><span>Enter למעבר · Esc לסגירה</span><span>⌘K / Ctrl+K</span></footer>
    </section>
  </div>;
}

function ResultButton({ tab, onClick }: { tab: Tab; onClick: () => void }) {
  const item = NAV_ITEMS.find(candidate => candidate.id === tab);
  if (!item) return null;
  const Icon = item.icon;
  return <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-right hover:bg-[#b79043]/10 focus:bg-[#b79043]/10">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b79043]/20 bg-[#b79043]/5 text-[#b79043]"><Icon size={17} /></span>
    <span className="min-w-0 flex-1"><strong className="block font-normal text-white">{item.label}</strong><span className="block truncate text-xs text-white/40">{TAB_META[tab].group} · {TAB_META[tab].description}</span></span>
  </button>;
}
