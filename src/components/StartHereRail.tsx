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
      <div className="px-4 sm:px-8 mb-1">
        <h2 className="library-rail-title text-white tracking-tight">המשיכו מכאן</h2>
      </div>
      <div className="library-rail-scroller flex overflow-x-auto px-4 sm:px-8">
        {items.map((item) => (
          <div key={item.section} className="shrink-0">
            <p className="text-[11px] text-white/55 mb-1">{item.label}</p>
            <CourseCard course={item.course} sectionName={item.section} />
          </div>
        ))}
      </div>
    </section>
  );
}
