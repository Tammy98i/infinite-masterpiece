import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { DirBack } from '../../components/DirArrow';
import { getFounderById, instructorToFounder, type Founder } from '../data/founders';
import { CATEGORIES } from '../../data/categories';
import { catalogApi } from '../../api/catalog';
import { teamMembersApi } from '../../api/teamMembers';
import type { Course, Instructor } from '../../types';

function personKey(value: string) {
  return value.trim().replace(/[׳'\"״`´]/g, '').replace(/\s+/g, ' ').toLowerCase();
}

export function FounderPage() {
  const { founderId } = useParams();
  const staticFounder = founderId ? getFounderById(founderId) : undefined;
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [memberFounder, setMemberFounder] = useState<Founder | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!founderId) return;
    let cancelled = false;
    setLoaded(false);
    setMemberFounder(undefined);
    setInstructor(null);
    setCourses([]);

    const catalogPromise = catalogApi.founder(founderId).catch(() => ({ instructor: null, courses: [] as Course[] }));
    const memberPromise = staticFounder
      ? Promise.resolve(undefined)
      : teamMembersApi.list().then(({ members }) => members.find((member) => member.id === founderId)).catch(() => undefined);

    Promise.all([catalogPromise, memberPromise]).then(async ([catalog, member]) => {
      if (cancelled) return;
      let nextCourses = catalog.courses;
      let nextInstructor = catalog.instructor;
      if (member) {
        const bio = [member.bio, member.vision, member.contribution].filter(Boolean).join('\n\n');
        setMemberFounder({
          id: member.id,
          name: member.name,
          title: member.role,
          blurb: member.bio.split(/\n\n+/)[0] || member.role,
          description: bio || member.role,
          image: member.photo,
          expertise: member.expertise,
          leadCategoryIds: [],
          portfolio: [],
        });
        if (nextCourses.length === 0) {
          const all = await catalogApi.get().catch(() => null);
          const match = all?.instructors.find((item) => personKey(item.name) === personKey(member.name));
          if (match) {
            nextInstructor = nextInstructor || match;
            nextCourses = (all?.courses || []).filter((course) => course.instructorId === match.id);
          }
        }
      }
      if (cancelled) return;
      setCourses(nextCourses);
      setInstructor(nextInstructor);
      setLoaded(true);
    }).catch(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [founderId, staticFounder]);

  useEffect(() => {
    if (!loaded) return;
    if (window.location.hash === '#lectures') {
      document.getElementById('lectures')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loaded]);

  const founder = staticFounder || memberFounder || (instructor ? instructorToFounder(instructor) : undefined);

  if (!founder && !loaded) {
    return <div className="min-h-screen" />;
  }

  if (!founder) {
    return <Navigate to="/#team" replace />;
  }

  const paragraphs = founder.description.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen text-white selection:bg-[#b79043]/30">
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
          <Link
            to="/#team"
            className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white mb-12 min-h-11 cursor-pointer transition-colors duration-200"
          >
            <DirBack />
            צוות המיזם
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
            <div className="lg:col-span-6 text-center">
              <h1 className="text-4xl md:text-5xl font-heading text-white tracking-tight mb-4">
                {founder.name}
              </h1>
              {founder.role ? (
                <p className="text-[#dfc47d] text-sm tracking-[0.22em] font-semibold mb-2">{founder.role}</p>
              ) : null}
              <p className="text-[#b79043] text-sm tracking-widest mb-8 font-medium">
                {founder.title}
              </p>
              <div className="max-w-xl mx-auto space-y-5">
                {paragraphs.map((p) => (
                  <p key={p} className="text-lg text-white/55 font-light leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
              {founder.expertise.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                  {founder.expertise.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 rounded-full border border-[#b79043]/30 text-[11px] tracking-widest text-[#b79043]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {(instructor?.externalLinks || []).length > 0 && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {instructor?.externalLinks?.map((item) => (
                    <a
                      key={`${item.label}-${item.url}`}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center min-h-11 px-4 rounded-full border border-white/15 text-sm text-white/70 hover:text-[#b79043] hover:border-[#b79043]/40 transition-colors duration-200 cursor-pointer"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
              {founder.leadCategoryIds.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs text-white/35 mb-3">קטגוריות שהוא מוביל</p>
                  <div className="flex flex-wrap gap-2">
                    {founder.leadCategoryIds.map((id) => {
                      const cat = CATEGORIES.find((c) => c.id === id);
                      return cat ? (
                        <span
                          key={id}
                          className="px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-white/55"
                        >
                          {cat.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {loaded && courses.length > 0 && (
                <a
                  href="#lectures"
                  className="inline-flex mt-8 text-sm text-white/55 hover:text-[#b79043] min-h-11 items-center cursor-pointer transition-colors duration-200"
                >
                  צפייה בהרצאות
                </a>
              )}
            </div>

            <div className="lg:col-span-6">
              {(instructor?.avatarUrl || founder.image) ? (
                <img
                  src={instructor?.avatarUrl || founder.image}
                  alt={founder.name}
                  className="w-full aspect-[4/5] max-h-[640px] object-cover"
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {founder.portfolio.length > 0 && (
        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-sm tracking-[0.25em] text-[#b79043] mb-8">תיק עסקי</h2>
            <div className="divide-y divide-white/10 border-t border-white/10">
              {founder.portfolio.map((item) => (
                <div key={item.title} className="py-6">
                  <h3 className="text-white text-lg font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-white/45 font-light leading-relaxed">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="lectures" className="pb-20 scroll-mt-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm tracking-[0.25em] text-[#b79043] mb-8">הרצאות בספרייה</h2>
          {!loaded && <p className="text-sm text-white/40 font-light">טוען הרצאות...</p>}
          {loaded && courses.length === 0 && (
            <p className="text-sm text-white/40 font-light leading-relaxed">
              הרצאות יעלו כאן כשישויכו למייסד מהאדמין.
            </p>
          )}
          {courses.length > 0 && (
            <div className="divide-y divide-white/10 border-t border-white/10">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/library/course/${encodeURIComponent(course.id)}`}
                  className="block py-6 group cursor-pointer"
                >
                  <h3 className="text-white text-lg font-medium mb-1 group-hover:text-[#b79043] transition-colors duration-200">
                    {course.title}
                  </h3>
                  <p className="text-sm text-white/45 font-light leading-relaxed">{course.subtitle}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-32 text-center px-4">
        <Link
          to="/#team"
          className="text-white/40 hover:text-[#b79043] transition-colors text-sm font-light cursor-pointer"
        >
          חזרה לצוות המיזם
        </Link>
        <div className="mt-8">
          <Link
            to="/application?type=88"
            className="inline-flex justify-center py-3 px-8 rounded-full text-sm text-[#b79043] border border-[#b79043]/40 hover:border-[#dfc47d] hover:text-[#dfc47d] transition-colors duration-200 min-h-11 cursor-pointer"
          >
            הגשת מועמדות לנבחרת 88
          </Link>
        </div>
      </section>
    </div>
  );
}
