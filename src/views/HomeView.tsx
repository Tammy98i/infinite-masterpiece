import React, { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ContinueWatchingRow } from '../components/ContinueWatchingRow';
import { CategoryRow } from '../components/CategoryRow';
import { HeroBanner } from '../components/HeroBanner';
import { LibraryPlanBanner } from '../components/LibraryPlanBanner';
import { TopicsGrid } from '../components/TopicsGrid';
import { LecturersRow } from '../components/LecturersRow';
import { StartHereRail } from '../components/StartHereRail';
import { RailSkeleton, SectionError } from '../components/LibraryStates';
import {
  dedupeCourses,
  isCourseNew,
  isTenMinuteCourse,
  pickStartHereCourses,
  pickWeeklyPopular,
} from '../utils/libraryHome';
import { getRecommendedWithReasons } from '../utils/recommendations';
import { trackEvent } from '../utils/analytics';
import { LibraryQuickActions } from '../components/LibraryQuickActions';
import { CatalogLoadingNotice } from '../components/CatalogLoadingNotice';
import '../styles/LibraryFlowPolish.css';

export const HomeView: React.FC = () => {
  const {
    courses,
    getContinueWatchingList,
    user,
    setView,
    catalogStatus,
    reloadCatalog,
    weeklyPopularIds,
    myList,
  } = useApp();

  useEffect(() => {
    trackEvent('library_view', { user_state: user.subscriptionPlan });
  }, [user.subscriptionPlan]);

  useEffect(() => {
    const reduce =
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion');
    const islands = Array.from(document.querySelectorAll<HTMLElement>('.library-island'));
    const appear = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add('is-in');
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );
    for (const node of islands) {
      if (reduce || node.getBoundingClientRect().top < window.innerHeight * 0.88) {
        node.classList.add('is-in');
      }
      appear.observe(node);
    }
    return () => appear.disconnect();
  }, [catalogStatus, courses.length, myList.length]);

  const continueList = getContinueWatchingList();
  const firstContinue = continueList[0];
  const continueIds = useMemo(() => new Set(continueList.map((c) => c.course.id)), [continueList]);
  const savedCourses = useMemo(() => {
    const byId = new Map(courses.map((course) => [course.id, course]));
    return myList.map((id) => byId.get(id)).filter((course): course is (typeof courses)[number] => Boolean(course));
  }, [courses, myList]);

  const heroCourse =
    firstContinue?.course ||
    courses.find((c) => c.isFeatured) ||
    pickWeeklyPopular(courses, 1, weeklyPopularIds)[0] ||
    courses[0];

  const heroId = heroCourse?.id;
  const excludeForRails = useMemo(() => new Set(continueIds), [continueIds]);
  const softHero = useMemo(() => (heroId ? new Set([heroId]) : new Set<string>()), [heroId]);

  const { courses: recommended, reasons, isPersonal } = useMemo(
    () => getRecommendedWithReasons(courses, user.interests, continueList.map((c) => c.course.title)),
    [courses, user.interests, continueList]
  );

  const recommendedDeduped = useMemo(
    () =>
      dedupeCourses(recommended, {
        excludeIds: excludeForRails,
        softExcludeIds: softHero,
        softExcludeFirstN: 4,
        limit: 8,
      }),
    [recommended, excludeForRails, softHero]
  );

  const shorts = useMemo(() => {
    const list = courses.filter(isTenMinuteCourse);
    return dedupeCourses(list, {
      excludeIds: excludeForRails,
      softExcludeIds: softHero,
      limit: 8,
    });
  }, [courses, excludeForRails, softHero]);

  const newest = useMemo(() => {
    const list = [...courses]
      .filter((c) => isCourseNew(c) || c.isNew)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return dedupeCourses(list, {
      excludeIds: excludeForRails,
      softExcludeIds: softHero,
      softExcludeFirstN: 4,
      limit: 8,
    });
  }, [courses, excludeForRails, softHero]);

  const weekly = useMemo(() => {
    const list = pickWeeklyPopular(courses, 12, weeklyPopularIds);
    return dedupeCourses(list, {
      excludeIds: excludeForRails,
      softExcludeIds: softHero,
      limit: 5,
    });
  }, [courses, excludeForRails, softHero, weeklyPopularIds]);

  const showShortsRail = shorts.length >= 3;
  const recommendedTitle = isPersonal ? 'מומלץ עבורך' : 'בחירת המערכת';
  const isLoading = catalogStatus === 'loading' && courses.length === 0;

  return (
    <div className="library-flow-page min-h-screen text-white overflow-x-hidden pb-28">
      {heroCourse ? (
        <HeroBanner
          course={heroCourse}
          continueWatching={
            firstContinue && firstContinue.course.id === heroCourse.id
              ? {
                  episodeId: firstContinue.episode.id,
                  episodeTitle: firstContinue.episode.title,
                  currentTime: firstContinue.progress.currentTime,
                  duration: firstContinue.progress.duration,
                }
              : undefined
          }
        />
      ) : (
        <section className="weekly-empty-hero" aria-busy={isLoading}>
          <img className="weekly-hero-bg" src="https://media.base44.com/images/public/6aa94dfb715e7d446231f544/3996d7937_generated_06560cca.jpg" alt="" />
          <div className="weekly-hero-scrim" aria-hidden="true" />
          <div className="weekly-empty-copy">
            <span className="weekly-curation-mark" aria-hidden="true">✦</span>
            <h1>Infinite Masterpiece</h1>
            {catalogStatus === 'error' ? (
              <>
                <p>לא הצלחנו לטעון את הספרייה. נסו שוב בעוד רגע.</p>
                <div className="weekly-empty-actions">
                  <button type="button" className="weekly-button primary" onClick={() => void reloadCatalog()}>טעינה מחדש</button>
                  <button type="button" className="weekly-button" onClick={() => setView('profile')}>חשבון</button>
                </div>
              </>
            ) : <p>{isLoading ? 'טוען את הספרייה…' : 'הספרייה מתעדכנת — תכנים נוספים בקרוב.'}</p>}
          </div>
        </section>
      )}

      <div className="weekly-rails relative z-10">

        {isLoading ? <CatalogLoadingNotice /> : null}

        {catalogStatus === 'error' && courses.length > 0 && (
          <SectionError
            message="לא הצלחנו לרענן את הקטלוג. מוצג תוכן שמור."
            onRetry={() => void reloadCatalog()}
          />
        )}

        {isLoading ? (
          <RailSkeleton title="מומלץ עבורך" />
        ) : recommendedDeduped.length > 0 ? (
          <CategoryRow
            id="rail-recommended"
            title={recommendedTitle}
            courses={recommendedDeduped}
            sectionName="recommended"
            reasons={reasons}
          />
        ) : courses.length > 0 ? (
          <SectionError message="לא הצלחנו לטעון את ההמלצות" onRetry={() => void reloadCatalog()} />
        ) : null}

        <div className="soundstage-console-dock">
          <div className="soundstage-console">
            <LibraryPlanBanner />
            <LibraryQuickActions />
          </div>
        </div>

        <div id="rail-continue" className="soundstage-split-stage max-w-[1400px] mx-auto">
          {continueList.length > 0 ? (
            <div className="soundstage-split-rails grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
              <div className="min-w-0">
                <ContinueWatchingRow />
              </div>
              <div className="min-w-0">
                <StartHereRail {...pickStartHereCourses(courses, user)} />
              </div>
            </div>
          ) : (
            <StartHereRail {...pickStartHereCourses(courses, user)} />
          )}
        </div>

        {savedCourses.length > 0 ? (
          <CategoryRow
            id="rail-list"
            title="הרשימה שלי"
            courses={savedCourses.slice(0, 8)}
            sectionName="my_list"
            onSeeAll={() => setView('mylist')}
            seeAllLabel="לכל הרשימה"
          />
        ) : null}

        {isLoading ? (
          <>
            <RailSkeleton title="10 דקות" />
            <RailSkeleton title="חדש בספרייה" />
          </>
        ) : (
          <>
            {showShortsRail ? (
              <CategoryRow
                id="rail-shorts"
                title="10 דקות"
                courses={shorts}
                sectionName="shorts"
                showDurationBadge
                onSeeAll={() => setView('shorts')}
                seeAllLabel="לכל התכנים הקצרים"
              />
            ) : null}

            <CategoryRow
              id="rail-new"
              title="חדש בספרייה"
              courses={newest}
              sectionName="new"
              showNewBadge
            />

            <CategoryRow
              id="rail-popular"
              title="הכי נצפים השבוע"
              courses={weekly}
              ranked
              sectionName="weekly"
            />

            <TopicsGrid />
            <LecturersRow />
          </>
        )}
      </div>
    </div>
  );
};
