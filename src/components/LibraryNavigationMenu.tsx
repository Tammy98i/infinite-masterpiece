import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

const LINKS = [
  { view: 'paths', label: 'מסלולי למידה' },
  { view: 'instructors', label: 'מומחים ומרצים' },
  { view: 'shorts', label: 'יש לי 10 דקות' },
  { view: 'quiz', label: 'מה מתאים לי' },
] as const;

export function LibraryNavigationMenu() {
  const { currentView, setView } = useApp();
  const ref = useRef<HTMLDetailsElement>(null);
  const active = LINKS.find(link => link.view === currentView || (link.view === 'instructors' && currentView === 'instructor'));

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  return (
    <details ref={ref} className="library-more-nav" onKeyDown={event => {
      if (event.key === 'Escape' && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector('summary')?.focus();
      }
    }} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false;
    }}>
      <summary className={active ? 'is-active' : ''}>עוד בספרייה<ChevronDown size={15} aria-hidden="true" /></summary>
      <div className="library-more-links">
        {LINKS.map(link => (
          <button key={link.view} type="button" aria-current={active?.view === link.view ? 'page' : undefined} onClick={() => {
            if (ref.current) {
              ref.current.open = false;
              ref.current.querySelector('summary')?.focus();
            }
            setView(link.view);
          }}>{link.label}</button>
        ))}
      </div>
    </details>
  );
}
