import { CourseCard } from './CourseCard';
import type { Course } from '../types';

type Props = {
  tenMinute?: Course;
  taste?: Course;
  newest?: Course;
  quiet?: boolean;
};

export function StartHereRail({ tenMinute, taste, newest, quiet = false }: Props) {
  const items = [
    tenMinute ? { course: tenMinute, label: '10 דקות', section: 'start_ten' } : null,
    taste ? { course: taste, label: 'טעימה פתוחה', section: 'start_taste' } : null,
    newest ? { course: newest, label: 'חדש בספרייה', section: 'start_new' } : null,
  ].filter((item): item is { course: Course; label: string; section: string } => Boolean(item));

  if (items.length === 0) return null;

  return (
    <section
      className={`library-spacious-section library-island library-island-flush py-3 select-none scroll-mt-24 ${
        quiet ? 'library-start-here-quiet' : ''
      }`}
      aria-label="המשיכו מכאן — רשימת הרצאות"
    >
      <div className="soundstage-section-header mx-auto flex max-w-[1400px] items-baseline justify-between px-4 sm:px-8 mb-3 pb-3 border-b border-[#D99B43]/20">
        <h2 className="library-rail-title text-[#F2EFEB] tracking-tight">המשיכו מכאן</h2>
      </div>
      <div className="library-rail-scroller mx-auto max-w-[1400px] flex overflow-x-auto px-4 sm:px-8">
        {items.map((item) => (
          <div key={item.section} className="shrink-0">
            <p className="text-[11px] font-mono tracking-[0.18em] text-[#D99B43] mb-1.5 uppercase">{item.label}</p>
            <CourseCard course={item.course} sectionName={item.section} />
          </div>
        ))}
      </div>
      <div className="soundstage-filmstrip mx-auto max-w-[1400px] px-4 sm:px-8 mt-3 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, idx) => (
          <i key={idx} className={`soundstage-filmstrip-cell ${idx < items.length ? 'is-active' : ''}`} />
        ))}
      </div>
    </section>
  );
}
