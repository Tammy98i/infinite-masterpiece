import { CourseCard } from './CourseCard';
import type { Course } from '../types';

type Props = {
  tenMinute?: Course;
  taste?: Course;
  newest?: Course;
};

export function StartHereRail({ tenMinute, taste, newest }: Props) {
  const items = [
    tenMinute ? { course: tenMinute, label: '10 דקות', section: 'start_ten' } : null,
    taste ? { course: taste, label: 'טעימה פתוחה', section: 'start_taste' } : null,
    newest ? { course: newest, label: 'חדש בספרייה', section: 'start_new' } : null,
  ].filter((item): item is { course: Course; label: string; section: string } => Boolean(item));

  if (items.length === 0) return null;

  return (
    <section className="py-8 select-none scroll-mt-24" aria-label="המשיכו מכאן — רשימת הרצאות">
      <div className="px-4 sm:px-8 mb-5">
        <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">המשיכו מכאן</h2>
        <p className="text-sm text-white/80 mt-1 font-medium">שלוש התחלות. בלי רשימה ריקה.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 sm:px-8">
        {items.map((item) => (
          <div key={item.section} className="min-w-0">
            <p className="text-[12px] text-white/70 mb-2">{item.label}</p>
            <CourseCard course={item.course} fullWidth sectionName={item.section} />
          </div>
        ))}
      </div>
    </section>
  );
}
