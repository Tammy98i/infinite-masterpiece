import { Clock3, Compass, Route, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ACTIONS = [
  { view: 'search', label: 'חיפוש מדויק', hint: 'שם, מרצה או נושא', icon: Search },
  { view: 'shorts', label: 'יש לי 10 דקות', hint: 'תוכן קצר וממוקד', icon: Clock3 },
  { view: 'paths', label: 'מסלולי למידה', hint: 'התקדמות לפי סדר', icon: Route },
  { view: 'quiz', label: 'מה מתאים לי?', hint: 'המלצה לפי הצורך', icon: Compass },
] as const;

export function LibraryQuickActions() {
  const { setView } = useApp();
  return <section aria-labelledby="quick-actions-heading" className="library-spacious-section library-island px-4 py-10 sm:px-8 lg:px-10">
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-4 flex items-end justify-between gap-3"><div><p className="mb-1 text-[11px] uppercase tracking-[.2em] text-[#b79043]">קיצור דרך</p><h2 id="quick-actions-heading" className="text-lg font-semibold text-white">איך תרצו להתקדם עכשיו?</h2></div></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{ACTIONS.map(item => <button key={item.view} type="button" onClick={() => setView(item.view)} className="library-quick-action group flex min-h-24 cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0b08]/65 p-4 text-right transition-colors hover:border-[#b79043]/45 hover:bg-[#b79043]/5 focus-visible:ring-2 focus-visible:ring-[#b79043]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#b79043] group-hover:bg-[#b79043]/10"><item.icon size={19} /></span><span className="min-w-0"><strong className="block text-sm font-medium text-white">{item.label}</strong><span className="mt-1 block text-xs text-white/40">{item.hint}</span></span>
      </button>)}</div>
    </div>
  </section>;
}
