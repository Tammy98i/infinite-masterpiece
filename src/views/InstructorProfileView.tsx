import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/CourseCard';
import { usePaywall } from '../context/PaywallContext';
import { hasFullLibraryAccess } from '../utils/access';

export const InstructorProfileView: React.FC = () => {
  const { instructors, courses, selectedInstructorId, setView, user } = useApp();
  const { openPaywall } = usePaywall();
  const instructor = instructors.find((i) => i.id === selectedInstructorId);
  const lectures = courses.filter((c) => c.instructorId === selectedInstructorId);

  useEffect(() => {
    if (!instructor?.isFounder) return;
    if (user.role === 'admin' || hasFullLibraryAccess(user)) return;
    if (sessionStorage.getItem('mc_paywall_founder') === '1') return;
    sessionStorage.setItem('mc_paywall_founder', '1');
    openPaywall('founder_profile');
  }, [instructor?.id, instructor?.isFounder, user.role, user.subscriptionPlan, openPaywall]);

  if (!instructor) {
    return (
      <div className="min-h-screen text-white pt-28 px-4 text-right">
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

  return (
    <div className="min-h-screen text-white pt-24 pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 text-right">
        <button
          type="button"
          onClick={() => setView('instructors')}
          className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white mb-10 min-h-11"
        >
          <ArrowRight className="w-4 h-4" />
          מרצים
        </button>

        <div className="flex items-start gap-5 mb-10">
          <img
            src={instructor.avatarUrl}
            alt={instructor.name ? `תמונת פרופיל: ${instructor.name}` : 'תמונת מרצה'}
            className="w-24 h-24 rounded-full object-cover border border-white/10 shrink-0"
          />
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight mb-2">{instructor.name}</h1>
            <p className="text-sm text-white/45">
              {instructor.isFounder ? <span className="text-[#C8A24C]/80">צוות המיזם · </span> : null}
              {instructor.title}
            </p>
          </div>
        </div>

        {instructor.bio ? (
          <p className="text-white/55 font-light leading-relaxed mb-8">{instructor.bio}</p>
        ) : null}

        {instructor.credentials.length > 0 ? (
          <ul className="mb-8 space-y-2">
            {instructor.credentials.map((item) => (
              <li key={item} className="text-sm text-white/40 font-light">
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {instructor.founderId ? (
          <Link
            to={`/premium-88/${instructor.founderId}`}
            className="inline-flex text-sm text-[#C8A24C] hover:text-[#F7E7B5] mb-12 min-h-11 items-center"
          >
            עמוד בצוות המיזם
          </Link>
        ) : (
          <div className="mb-12" />
        )}

        <h2 className="text-sm text-white/40 mb-6">הרצאות בספרייה</h2>
        {lectures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center sm:justify-items-stretch">
            {lectures.map((course) => (
              <CourseCard key={course.id} course={course} fullWidth />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40 font-light">עדיין אין הרצאות משויכות.</p>
        )}
      </div>
    </div>
  );
};
