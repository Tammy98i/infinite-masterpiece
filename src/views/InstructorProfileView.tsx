import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/CourseCard';
import { usePaywall } from '../context/PaywallContext';
import { hasFullLibraryAccess } from '../utils/access';

function portraitLetter(name: string) {
  return name.trim().charAt(0) || 'מ';
}

export const InstructorProfileView: React.FC = () => {
  const { instructors, courses, selectedInstructorId, setView, user } = useApp();
  const { openPaywall } = usePaywall();
  const instructor = instructors.find((i) => i.id === selectedInstructorId);
  const lectures = courses.filter((c) => c.instructorId === selectedInstructorId);
  const firstLecture = lectures[0];
  const countLabel =
    lectures.length === 0 ? 'אין הרצאות עדיין' : lectures.length === 1 ? 'הרצאה אחת' : `${lectures.length} הרצאות`;

  useEffect(() => {
    if (!instructor?.isFounder) return;
    if (user.role === 'admin' || hasFullLibraryAccess(user)) return;
    if (sessionStorage.getItem('mc_paywall_founder') === '1') return;
    sessionStorage.setItem('mc_paywall_founder', '1');
    openPaywall('founder_profile');
  }, [instructor?.id, instructor?.isFounder, user.role, user.subscriptionPlan, openPaywall]);

  if (!instructor) {
    return (
      <div className="library-catalog-page min-h-screen text-white pt-28 px-4 text-right">
        <button
          type="button"
          onClick={() => setView('instructors')}
          className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white mb-10 min-h-11"
        >
          <ArrowRight className="w-4 h-4" />
          מרצים
        </button>
        <p className="text-sm text-white/45">המרצה לא נמצא.</p>
      </div>
    );
  }

  const scrollToLectures = () => {
    document.getElementById('instructor-lectures')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="library-catalog-page library-instructor-page min-h-screen text-white pb-28">
      <header className="library-instructor-billboard relative min-h-[58vh] md:min-h-[70vh] flex items-end overflow-hidden pt-24 pb-16 md:pb-20">
        <div className="absolute inset-0 select-none overflow-hidden">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={instructor.name ? `תמונת פרופיל: ${instructor.name}` : 'תמונת מרצה'}
              className="w-full h-full object-cover object-top scale-105"
            />
          ) : (
            <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-[#b79043] text-7xl font-semibold" aria-hidden>
              {portraitLetter(instructor.name)}
            </div>
          )}
          <div className="library-course-veil-a absolute inset-0" />
          <div className="library-course-veil-b absolute inset-0" />
          <div className="library-course-veil-c absolute inset-0" />
          <div className="library-course-veil-d absolute inset-0" />
        </div>

        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-8 w-full text-right">
          <button
            type="button"
            onClick={() => setView('instructors')}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6 min-h-11"
          >
            <ArrowRight className="w-4 h-4" />
            מרצים
          </button>

          <h1 className="text-4xl sm:text-6xl lg:text-[4.5rem] font-bold text-white leading-[1.05] tracking-tight mb-3 max-w-4xl">
            {instructor.name}
          </h1>
          <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/80">
            {instructor.isFounder ? <span>צוות המיזם</span> : null}
            {instructor.isFounder ? <span aria-hidden>·</span> : null}
            <span>{instructor.title}</span>
            <span aria-hidden>·</span>
            <span>{countLabel}</span>
          </p>
          {instructor.bio ? (
            <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed max-w-2xl mb-6 line-clamp-3">
              {instructor.bio}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {firstLecture ? (
              <button
                type="button"
                onClick={() => setView('course', { courseId: firstLecture.id })}
                className="library-hero-play inline-flex items-center justify-center px-7 py-2.5 text-sm font-semibold min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
              >
                להרצאות
              </button>
            ) : null}
            <button
              type="button"
              onClick={scrollToLectures}
              className="library-hero-more inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
            >
              הרצאות בספרייה
            </button>
            {instructor.founderId ? (
              <Link
                to={`/premium-88/${instructor.founderId}`}
                className="inline-flex text-sm text-[#dfc47d] hover:text-white min-h-11 items-center"
              >
                עמוד בצוות המיזם
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-8 max-w-[1360px] mx-auto px-4 sm:px-8 text-right">
        {instructor.bio ? (
          <section className="mb-8 max-w-3xl">
            <h2 className="library-rail-title text-white mb-3">על המרצה</h2>
            <p className="text-white/70 font-light leading-relaxed">{instructor.bio}</p>
          </section>
        ) : null}

        {instructor.credentials.length > 0 ? (
          <section className="mb-10">
            <h2 className="library-rail-title text-white mb-3">רקע</h2>
            <ul className="space-y-2">
              {instructor.credentials.map((item) => (
                <li key={item} className="text-sm text-white/55 font-light">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="instructor-lectures" className="scroll-mt-24">
          <h2 className="library-rail-title text-white mb-4">הרצאות בספרייה</h2>
          {lectures.length > 0 ? (
            <div className="library-page-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 justify-items-stretch">
              {lectures.map((course) => (
                <CourseCard key={course.id} course={course} fullWidth />
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40 font-light">עדיין אין הרצאות משויכות.</p>
          )}
        </section>
      </div>
    </div>
  );
};
