import type { Category, Course, Instructor, PublishStatus } from '../types';
import { Bidi } from './Bidi';
import { responsiveImageAttrs } from '../utils/responsiveImage';

const STATUS_LABEL: Record<PublishStatus, string> = {
  draft: 'טיוטה',
  pending_review: 'בבדיקה',
  published: 'באוויר',
  blocked: 'חסום',
};

type Props = {
  courses: Course[];
  instructors?: Instructor[];
  categories?: Category[];
  eyebrow?: string;
  kicker?: string;
  featuredActionLabel: string;
  secondaryActionLabel?: string;
  onFeaturedAction: (course: Course) => void;
  onSecondaryAction?: (course: Course) => void;
  onSelectCourse: (course: Course) => void;
  /** Short banner only — no rails (admin overview polish) */
  compact?: boolean;
};

function pickFeatured(courses: Course[]) {
  return (
    courses.find((course) => course.isFeatured && course.status === 'published') ||
    courses.find((course) => course.isPopular && course.status === 'published') ||
    courses.find((course) => course.status === 'published') ||
    courses[0] ||
    null
  );
}

function railOf(courses: Course[], predicate: (course: Course) => boolean) {
  return courses.filter(predicate).slice(0, 16);
}

export function CrmCatalogStage({
  courses,
  instructors = [],
  categories = [],
  eyebrow = 'קטלוג אקדמי',
  kicker,
  featuredActionLabel,
  secondaryActionLabel = 'פירוט ההרצאה',
  onFeaturedAction,
  onSecondaryAction,
  onSelectCourse,
  compact = false,
}: Props) {
  const featured = pickFeatured(courses);
  const published = railOf(courses, (course) => course.status === 'published');
  const pending = railOf(courses, (course) => course.status === 'pending_review');
  const drafts = railOf(courses, (course) => course.status === 'draft');
  const instructorName = (id?: string) => instructors.find((item) => item.id === id)?.name || '';

  return (
    <div className="crm-catalog-stage grid gap-8">
      {featured ? (
        <section
          className={`crm-hero relative flex items-end overflow-hidden ${
            compact ? 'pt-10 pb-8 sm:pt-12 sm:pb-9 min-h-0' : 'pt-16 pb-10 sm:pt-20 sm:pb-12'
          }`}
          aria-label={`הרצאה מומלצת: ${featured.title}`}
        >
          <div className="absolute inset-0 select-none overflow-hidden">
            <img
              {...responsiveImageAttrs(featured.backdropImage || featured.coverImage, {
                widths: [768, 1200, 1600],
                sizes: '100vw',
                defaultWidth: 1600,
              })}
              alt=""
              aria-hidden
              className="h-full w-full object-cover object-center scale-105"
            />
            <div className="crm-hero-veil-bottom absolute inset-0" />
            <div className="crm-hero-veil-side absolute inset-0 w-full md:w-[72%] ms-auto" />
            <div className="absolute inset-0 bg-black/25" />
          </div>
          <div className="relative z-10 w-full max-w-2xl px-5 sm:px-8 text-start">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#dfc47d] mb-2">{eyebrow}</p>
            {kicker ? <p className="text-sm text-white/70 mb-2">{kicker}</p> : null}
            <h2
              className={`font-bold text-white leading-[1.08] tracking-tight ${
                compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'
              }`}
            >
              {compact ? 'לטיפול עכשיו' : featured.title}
            </h2>
            {compact ? (
              <p className="mt-2 max-w-xl text-sm text-white/70 leading-relaxed">
                {featured.title}
                {featured.subtitle ? ` — ${featured.subtitle}` : ''}
              </p>
            ) : featured.subtitle ? (
              <p className="mt-3 max-w-xl text-sm sm:text-base text-white/75 leading-relaxed">{featured.subtitle}</p>
            ) : null}
            {compact ? null : (
              <p className="mt-3 text-xs text-white/50">
                {instructorName(featured.instructorId) || 'מרצה'}
                {featured.level ? ` · ${featured.level}` : ''}
                {featured.status ? ` · ${STATUS_LABEL[featured.status]}` : ''}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="crm-hero-play min-h-11 px-5 text-sm font-semibold cursor-pointer" onClick={() => onFeaturedAction(featured)}>
                {featuredActionLabel}
              </button>
              <button
                type="button"
                className="crm-hero-more min-h-11 px-5 text-sm font-medium cursor-pointer"
                onClick={() => (onSecondaryAction || onSelectCourse)(featured)}
              >
                {secondaryActionLabel}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="crm-hero relative flex items-end overflow-hidden min-h-52 px-5 sm:px-8 py-10">
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,10,20,.88)] to-[rgba(5,10,20,.35)]" />
          <div className="relative z-10 text-start">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#dfc47d] mb-2">{eyebrow}</p>
            <h2 className="text-3xl font-bold text-white">עדיין אין הרצאות בקטלוג</h2>
            <p className="mt-2 text-sm text-white/60">כשעולה תוכן אקדמי הוא יופיע כאן כמו בספרייה — כרזות, פסים וגיבור.</p>
          </div>
        </section>
      )}

      {compact ? null : (
        <>
      <CourseRail title="הרצאות באוויר" courses={published} instructors={instructors} onSelect={onSelectCourse} />
      <CourseRail title="ממתינות לאישור" courses={pending} instructors={instructors} onSelect={onSelectCourse} />
      <CourseRail title="טיוטות אקדמיות" courses={drafts} instructors={instructors} onSelect={onSelectCourse} />

      {instructors.length > 0 ? (
        <section className="library-island">
          <h3 className="crm-rail-title">המרצים והטכנאים</h3>
          <div className="crm-rail-scroller" role="list">
            {instructors.slice(0, 16).map((person) => (
              <div key={person.id} className="crm-poster w-[140px] sm:w-[160px]" role="listitem">
                <div className="relative aspect-square bg-[rgba(5,10,20,.7)]">
                  {person.avatarUrl ? (
                    <img src={person.avatarUrl} alt="" className="h-full w-full object-cover object-[center_18%]" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl text-[#dfc47d]">
                      {(person.name[0] || '?').toUpperCase()}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
                <p className="mt-2 text-sm text-white truncate">{person.name}</p>
                {person.title ? <p className="text-[11px] text-white/45 truncate">{person.title}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section className="library-island">
          <h3 className="crm-rail-title">תחומים אקדמיים</h3>
          <div className="crm-rail-scroller" role="list">
            {categories.slice(0, 16).map((category) => (
              <div key={category.id} className="crm-poster w-[180px] sm:w-[200px]" role="listitem">
                <div className="relative aspect-video">
                  {category.coverImage ? (
                    <img src={category.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-[rgba(5,10,20,.7)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <p className="absolute inset-x-2 bottom-2 text-sm font-semibold text-white">{category.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
        </>
      )}
    </div>
  );
}

function CourseRail({
  title,
  courses,
  instructors,
  onSelect,
}: {
  title: string;
  courses: Course[];
  instructors: Instructor[];
  onSelect: (course: Course) => void;
}) {
  if (courses.length === 0) return null;
  return (
    <section className="library-island">
      <h3 className="crm-rail-title">
        {title} <span className="text-white/40 font-normal">· <Bidi kind="ltr">{String(courses.length)}</Bidi></span>
      </h3>
      <div className="crm-rail-scroller" role="list">
        {courses.map((course) => (
          <button
            key={course.id}
            type="button"
            role="listitem"
            className="crm-poster text-start"
            onClick={() => onSelect(course)}
            aria-label={course.title}
          >
            <div className="relative aspect-video">
              {course.coverImage ? (
                <img
                  {...responsiveImageAttrs(course.coverImage, { defaultWidth: 480, sizes: '240px' })}
                  alt=""
                  className="h-full w-full object-cover brightness-[0.92]"
                />
              ) : (
                <div className="h-full w-full bg-[rgba(5,10,20,.7)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <span className="crm-poster-play absolute inset-0 z-[1] flex items-center justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-white text-black text-xs font-semibold">
                  פתח
                </span>
              </span>
              {course.status ? (
                <span className="absolute top-2 start-2 z-10 rounded bg-black/75 px-2 py-0.5 text-[11px] text-white/90">
                  {STATUS_LABEL[course.status]}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-white line-clamp-2">{course.title}</p>
            <p className="text-[11px] text-white/45 truncate">{instructors.find((item) => item.id === course.instructorId)?.name || course.level}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
