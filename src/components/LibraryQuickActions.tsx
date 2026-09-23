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
  return <section aria-labelledby="quick-actions-heading" className="library-spacious-section library-island px-4 py-3 sm:px-8 lg:px-10">
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-1"><h2 id="quick-actions-heading" className="library-rail-title text-white">איך תרצו להתקדם עכשיו?</h2></div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{ACTIONS.map(item => <button key={item.view} type="button" onClick={() => setView(item.view)} className="library-quick-action group flex min-h-14 cursor-pointer items-center gap-3 border border-white/10 p-3 text-right transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#b79043]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#b79043] group-hover:bg-[#b79043]/10"><item.icon size={19} /></span><span className="min-w-0"><strong className="block text-sm font-medium text-white">{item.label}</strong><span className="mt-1 block text-xs text-white/40">{item.hint}</span></span>
      </button>)}</div>
    </div>
  </section>;
}
