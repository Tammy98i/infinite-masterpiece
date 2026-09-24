import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';

function portraitLetter(name: string) {
  return name.trim().charAt(0) || 'מ';
}

export const InstructorsView: React.FC = () => {
  const { instructors, courses, setView } = useApp();

  const featured = useMemo(
    () => instructors.find((inst) => inst.isFounder && inst.avatarUrl) || instructors.find((inst) => inst.avatarUrl) || instructors[0],
    [instructors]
  );
  const featuredCount = featured
    ? courses.filter((course) => course.instructorId === featured.id).length
    : 0;

  const scrollToGrid = () => {
    document.getElementById('instructor-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="library-catalog-page library-instructor-index min-h-screen text-white pb-24">
      <header className="library-instructor-billboard relative min-h-[58vh] md:min-h-[70vh] flex items-end overflow-hidden pt-24 pb-16 md:pb-20">
        <div className="absolute inset-0 select-none overflow-hidden bg-[#141414]">
          <div className="library-course-veil-a absolute inset-0" />
          <div className="library-course-veil-b absolute inset-0" />
          <div className="library-course-veil-c absolute inset-0" />
          <div className="library-course-veil-d absolute inset-0" />
        </div>

        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-8 w-full text-start grid gap-8 md:grid-cols-[minmax(220px,32%)_1fr] md:items-end">
          <div className="library-instructor-frame relative w-full max-w-[360px] ms-auto md:ms-0">
            {featured?.avatarUrl ? (
              <img src={featured.avatarUrl} alt="" aria-hidden />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-[#b79043] text-7xl font-semibold" aria-hidden>
                {featured ? portraitLetter(featured.name) : 'מ'}
              </div>
            )}
          </div>
          <div>
          <p className="text-[13px] text-white/70 mb-3">המרצים של הספרייה</p>
          <h1 className="text-4xl sm:text-6xl lg:text-[4.5rem] font-bold text-white leading-[1.05] tracking-tight mb-4">
            מרצים
          </h1>
          <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed max-w-2xl mb-4">
            בחרו מרצה כדי לראות את ההרצאות שלו בספרייה.
          </p>
          {featured ? (
            <p className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/80">
              <span>{featured.name}</span>
              <span aria-hidden>·</span>
              <span>{featured.title}</span>
              {featured.isFounder ? (
                <>
                  <span aria-hidden>·</span>
                  <span>צוות המיזם</span>
                </>
              ) : null}
              <span aria-hidden>·</span>
              <span>
                {featuredCount === 0 ? 'אין הרצאות עדיין' : featuredCount === 1 ? 'הרצאה אחת' : `${featuredCount} הרצאות`}
              </span>
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            {featured ? (
              <button
                type="button"
                onClick={() => setView('instructor', { instructorId: featured.id })}
                className="library-hero-play inline-flex items-center justify-center px-7 py-2.5 text-sm font-semibold min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
              >
                לפרופיל
              </button>
            ) : null}
            <button
              type="button"
              onClick={scrollToGrid}
              className="library-hero-more inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
            >
              לכל המרצים
            </button>
          </div>
          </div>
        </div>
      </header>

      <div id="instructor-grid" className="relative z-10 -mt-8 max-w-[1360px] mx-auto px-4 sm:px-8 text-start scroll-mt-24">
        <h2 className="library-rail-title text-white mb-4">כל המרצים</h2>
        <div className="library-page-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {instructors.map((inst) => {
            const count = courses.filter((c) => c.instructorId === inst.id).length;
            const countLabel = count === 0 ? 'אין הרצאות עדיין' : count === 1 ? 'הרצאה אחת' : `${count} הרצאות`;
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => setView('instructor', { instructorId: inst.id })}
                aria-label={`${inst.name}, ${inst.title}, ${countLabel}`}
                className="library-poster text-start min-h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
              >
                <div className="library-instructor-frame relative overflow-hidden rounded-[4px]">
                  {inst.avatarUrl ? (
                    <img src={inst.avatarUrl} alt="" aria-hidden />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-[#b79043] text-3xl font-semibold" aria-hidden>
                      {portraitLetter(inst.name)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 start-2 end-2">
                    <div className="text-[13px] font-semibold text-white truncate">{inst.name}</div>
                    <div className="text-[12px] text-white/70 truncate">
                      {inst.isFounder ? 'צוות המיזם · ' : ''}
                      {inst.title}
                    </div>
                    <div className="text-[11px] text-white/55 mt-0.5">{countLabel}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
