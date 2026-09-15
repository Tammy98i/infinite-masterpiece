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
  return <section aria-labelledby="quick-actions-heading" className="px-4 py-6 sm:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-end justify-between gap-3"><div><p className="mb-1 text-[11px] uppercase tracking-[.2em] text-[#C8A24C]">קיצור דרך</p><h2 id="quick-actions-heading" className="text-lg font-semibold text-white">איך תרצו להתקדם עכשיו?</h2></div></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{ACTIONS.map(item => <button key={item.view} type="button" onClick={() => setView(item.view)} className="group flex min-h-24 items-center gap-3 rounded-2xl border border-white/10 bg-[#010308]/65 p-4 text-right transition-colors hover:border-[#C8A24C]/45 hover:bg-[#C8A24C]/5 focus-visible:ring-2 focus-visible:ring-[#C8A24C]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#C8A24C] group-hover:bg-[#C8A24C]/10"><item.icon size={19} /></span><span className="min-w-0"><strong className="block text-sm font-medium text-white">{item.label}</strong><span className="mt-1 block text-xs text-white/40">{item.hint}</span></span>
      </button>)}</div>
    </div>
  </section>;
}
