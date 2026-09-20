import { useEffect, useState } from 'react';

export type SectionNavItem = { id: string; label: string };
export function SectionNav({ items, ariaLabel = 'ניווט בתוך העמוד' }: { items: SectionNavItem[]; ariaLabel?: string }) {
  const [active, setActive] = useState(items[0]?.id || '');
  const itemIds = items.map(item => item.id).join('|');
  useEffect(() => {
    const nodes = items.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-25% 0px -60%', threshold: [0, .25, .6] });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [itemIds]);
  return <nav aria-label={ariaLabel} className="sticky top-20 z-30 border-y border-white/[0.07] bg-[#0d0b08]/88 backdrop-blur-xl">
    <div className="mx-auto flex max-w-[1100px] snap-x items-center gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
      {items.map(item => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined} className={`min-h-10 shrink-0 snap-start rounded-full px-4 py-2 text-sm transition-colors ${active === item.id ? 'bg-[#b79043]/15 text-[#dfc47d]' : 'text-white/45 hover:text-white'}`}>{item.label}</a>)}
    </div>
  </nav>;
}
