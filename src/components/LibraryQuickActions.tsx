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
  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="soundstage-faders-section library-spacious-section library-island px-4 py-3 sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-2 sr-only">
          <h2 id="quick-actions-heading" className="library-rail-title text-white">
            איך תרצו להתקדם עכשיו?
          </h2>
        </div>
        <div className="soundstage-faders-grid grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ACTIONS.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              className="library-quick-action soundstage-fader group flex flex-col justify-between min-h-24 cursor-pointer p-4 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B43]"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="soundstage-fader-led" aria-hidden="true" />
                <span className="text-[#D99B43]/80 group-hover:text-[#D99B43] transition-colors">
                  <item.icon size={17} />
                </span>
              </div>
              <div className="min-w-0">
                <strong className="block text-base font-bold text-[#F2EFEB] group-hover:text-[#dfc47d] transition-colors">
                  {item.label}
                </strong>
                <span className="mt-1 block text-xs text-[#b5a892]">{item.hint}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
