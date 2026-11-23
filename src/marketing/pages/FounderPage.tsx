import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { DirBack } from '../../components/DirArrow';
import { getFounderById, instructorToFounder, type Founder } from '../data/founders';
import { CATEGORIES } from '../../data/categories';
import { catalogApi } from '../../api/catalog';
import { teamMembersApi } from '../../api/teamMembers';
import type { Course, Instructor } from '../../types';
import './TeamProfile.css';

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
    return (
      <article className="team-profile" aria-busy="true">
        <div className="team-profile-wrap">
          <p className="team-profile-empty">טוענים את הפרופיל…</p>
        </div>
      </article>
    );
  }

  if (!founder) {
    return <Navigate to="/#team" replace />;
  }

  const paragraphs = founder.description.split(/\n\n+/).filter(Boolean);
  const portrait = instructor?.avatarUrl || founder.image;
  const categories = founder.leadCategoryIds
    .map((id) => CATEGORIES.find((category) => category.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <article className="team-profile">
      <div className="team-profile-wrap">
        <Link to="/#team" className="team-profile-back">
          <DirBack />
          צוות המיזם
        </Link>
        <header className="team-profile-hero">
          {portrait ? (
            <img className="team-profile-portrait" src={portrait} alt={founder.name} />
          ) : (
            <div className="team-profile-portrait team-profile-letter" aria-hidden="true">{founder.name.trim().charAt(0)}</div>
          )}
          <div>
            <p className="team-profile-kicker">צוות המיזם</p>
            <h1>{founder.name}</h1>
            {founder.role ? <p className="team-profile-role">{founder.role}</p> : null}
            <p className="team-profile-title">{founder.title}</p>
            <div className="team-profile-copy">
              {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            {founder.expertise.length > 0 && (
              <div className="team-profile-chips">
                {founder.expertise.map((item) => <span key={item}>{item}</span>)}
              </div>
            )}
            {categories.length > 0 && (
              <div className="team-profile-chips">
                {categories.map((name) => <span key={name}>{name}</span>)}
              </div>
            )}
            {(instructor?.externalLinks || []).length > 0 && (
              <div className="team-profile-links">
                {instructor?.externalLinks?.map((item) => (
                  <a key={`${item.label}-${item.url}`} href={item.url} target="_blank" rel="noreferrer">{item.label}</a>
                ))}
              </div>
            )}
          </div>
        </header>
        {founder.portfolio.length > 0 && (
          <section className="team-profile-section">
            <h2>תיק עסקי</h2>
            <div className="team-profile-portfolio">
              {founder.portfolio.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        <section id="lectures" className="team-profile-section">
          <h2>הרצאות בספרייה</h2>
          {!loaded && <p className="team-profile-empty">טוען הרצאות...</p>}
          {loaded && courses.length === 0 && <p className="team-profile-empty">הרצאות יופיעו כאן כשישויכו לאיש הצוות.</p>}
          {courses.length > 0 && (
            <div className="team-profile-lectures">
              {courses.map((course) => (
                <Link key={course.id} to={`/library/course/${encodeURIComponent(course.id)}`} className="team-profile-lecture">
                  <h3>{course.title}</h3>
                  {course.subtitle ? <p>{course.subtitle}</p> : null}
                </Link>
              ))}
            </div>
          )}
        </section>
        <div className="team-profile-return">
          <Link to="/#team">חזרה לצוות המיזם</Link>
          <Link to="/application?type=88">הגשת מועמדות לנבחרת 88</Link>
        </div>
      </div>
    </article>
  );
}
