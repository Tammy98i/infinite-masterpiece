import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const DESTINATIONS = [
  { to: '/', title: 'דף הבית', description: 'המערכת העסקית סביב היצירה', keywords: 'יצירה מערכת הכנסה' },
  { to: '/webinar', title: 'וובינר חי', description: 'היכרות, התאמה והרשמה לערב החי', keywords: 'הרשמה ערב שאלות התאמה' },
  { to: '/journey', title: 'מסע 33 הימים', description: 'ארבעת שלבי התהליך', keywords: 'מכירות שיווק תשתיות סקייל' },
  { to: '/pricing', title: 'מסלולים ומחיר', description: 'אמיצים או הססנים', keywords: '8008 8888 תשלום פעימות' },
  { to: '/premium-88', title: 'צוות המיזם', description: 'האנשים שמאחורי שכבת העומק', keywords: 'מייסדים מומחים נבחרת' },
  { to: '/faq', title: 'שאלות נפוצות', description: 'תשובות לפני קבלת החלטה', keywords: 'החזר מתאים ספרייה pods' },
  { to: '/library-membership', title: 'מנוי ספרייה', description: 'פרטי הגישה לספריית אינסוף', keywords: 'קורסים הרצאות תוכן' },
  { to: '/library', title: 'כניסה לספרייה', description: 'המשך צפייה באזור האישי', keywords: 'התחברות חשבון קורסים' },
];

export function SiteSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setQuery('');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return DESTINATIONS.slice(0, 6);
    return DESTINATIONS.filter(item => `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(normalized));
  }, [query]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[14vh]">
    <button type="button" onClick={onClose} className="absolute inset-0 bg-[#0d0b08]/85 backdrop-blur-md" aria-label="סגירת חיפוש" />
    <section role="dialog" aria-modal="true" aria-labelledby="site-search-title" className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#b79043]/30 bg-[#06080d] shadow-2xl">
      <h2 id="site-search-title" className="sr-only">חיפוש באתר</h2>
      <div className="flex items-center gap-3 border-b border-white/10 px-5">
        <Search size={19} className="text-[#b79043]" />
        <input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Escape' && onClose()} placeholder="מה תרצו למצוא?" className="min-h-16 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35" />
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-white/45 hover:bg-white/5 hover:text-white" aria-label="סגירה"><X size={18} /></button>
      </div>
      <div className="max-h-[55vh] overflow-y-auto p-3">
        {results.length ? results.map(item => <Link key={item.to} to={item.to} onClick={onClose} className="group flex min-h-16 items-center gap-4 rounded-2xl px-4 py-3 text-right hover:bg-[#b79043]/10">
          <span className="min-w-0 flex-1"><strong className="block font-normal text-white">{item.title}</strong><span className="mt-1 block text-sm text-white/45">{item.description}</span></span><ArrowLeft size={17} className="text-white/25 transition-transform group-hover:-translate-x-1 group-hover:text-[#b79043]" />
        </Link>) : <p className="px-5 py-12 text-center text-sm text-white/45">לא מצאנו עמוד מתאים. נסו ניסוח קצר יותר.</p>}
      </div>
    </section>
  </div>;
}
