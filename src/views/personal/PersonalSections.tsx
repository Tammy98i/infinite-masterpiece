import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_WEBINAR_CONFIG } from '../../constants/webinar';
import type { CommunityPost } from '../../api/community';
import type { Category, Course, Instructor, LearningPath, UserProfile, WatchProgress } from '../../types';

export type AreaId =
  | 'home'
  | 'feed'
  | 'calendar'
  | 'recordings'
  | 'courses'
  | 'shorts'
  | 'club'
  | 'agents'
  | 'hall'
  | 'partners'
  | 'contact';

export const AREAS: Array<{ id: AreaId; label: string }> = [
  { id: 'home', label: 'ראשי' },
  { id: 'feed', label: 'בית הקהילה' },
  { id: 'calendar', label: 'לוח חודשי' },
  { id: 'recordings', label: 'הקלטות מפגשים' },
  { id: 'courses', label: 'קורסים ושיעורים' },
  { id: 'shorts', label: 'הדרכות קצרות' },
  { id: 'club', label: 'מועדון' },
  { id: 'agents', label: 'סוכני AI' },
  { id: 'hall', label: 'היכל התהילה' },
  { id: 'partners', label: 'תוכנית שותפים' },
  { id: 'contact', label: 'צור קשר' },
];

export const AREA_NOTES: Record<AreaId, string> = {
  home: 'כאן רואים מה לעשות עכשיו, ואחר כך את ההרצאות והאנשים.',
  feed: 'כאן כותבים לקהילה, מגיבים, ושומרים פוסט אצלכם.',
  calendar: 'היום בעיגול זהב. מפגש מסומן בתוך היום.',
  recordings: 'מפגשים שהתקיימו, וההקלטה כשהיא מוכנה.',
  courses: 'כל ההרצאות שפתוחות במסלול שלכם. לחצו על הרצאה כדי להיכנס.',
  shorts: 'כל אחת נמשכת עד עשר דקות.',
  club: 'המסלול הפעיל פותח את הספרייה ואת הקהילה.',
  agents: 'העזרה האוטומטית עדיין לא פעילה. הכפתור פונה לצוות.',
  hall: 'המקום לפי הודעות בקהילה.',
  partners: 'שולחים קישור לחבר. הספירה תיפתח אחר כך.',
  contact: 'אנחנו כאן לכל שאלה.',
};

export const NAV_GROUPS: Array<{ label: string; ids: AreaId[] }> = [
  { label: 'צפייה', ids: ['home', 'courses', 'shorts', 'recordings'] },
  { label: 'קהילה', ids: ['feed', 'calendar'] },
  { label: 'מועדון', ids: ['club', 'hall', 'partners', 'agents', 'contact'] },
];

export type ClubSession = { startsAt: string; title: string; notes: string };
export type AssignedPod = { name: string; week: number; role: 'captain' | 'member' };

const AGENTS = [
  { name: 'סיכום הרצאה', text: 'מסכם הרצאה לנקודות שאפשר ליישם השבוע.', tone: 'סיכום' },
  { name: 'עוזר המסע', text: 'מפרק את משימת השבוע בפוד לצעדים קטנים.', tone: 'מסע' },
  { name: 'סטוריטלינג', text: 'בונה פתיח, דוגמה וסיום להרצאה קצרה.', tone: 'תוכן' },
  { name: 'שאלות לצוות', text: 'מנסח פנייה ברורה לפני שהיא נשלחת לצוות.', tone: 'שירות' },
  { name: 'תכנון שבוע', text: 'מסדר צפייה, תרגול ושיחה בקהילה ללוח השבוע.', tone: 'לוח' },
  { name: 'משוב אישי', text: 'הופך צפייה להרצאה להערה אחת שאפשר לפרסם.', tone: 'קהילה' },
];

export function jerusalemParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const text = date.toLocaleString('sv-SE', { timeZone: 'Asia/Jerusalem' });
  const [dayText, timeText = '00:00:00'] = text.split(' ');
  const [year, month, day] = dayText.split('-').map(Number);
  return { year, month: month - 1, day, time: timeText.slice(0, 5) };
}

export function memberActivity(user: UserProfile, posts: CommunityPost[], watches: number) {
  const mine = posts.filter((post) => post.author.firstName && user.name.startsWith(post.author.firstName)).length;
  return { posts: mine, watches };
}

export function HomeDesk({
  user,
  posts,
  shorts,
  saved,
  history,
  paths,
  instructors,
  mine,
  recommended,
  newest,
  categories,
  founders,
  continueItem,
  session,
  pod,
  watches,
  onOpenFeed,
  onOpenCourse,
  onOpenCourses,
  onOpenCategory,
  onOpenShorts,
  onOpenView,
  onOpenInstructor,
  onOpenProfile,
  onOpenCalendar,
  onOpenSession,
  onWatch,
}: {
  user: UserProfile;
  posts: CommunityPost[];
  shorts: Course[];
  saved: Course[];
  history: Array<{ course: Course; episode: { id: string; title: string } }>;
  paths: LearningPath[];
  instructors: Instructor[];
  mine: Course[];
  recommended: Course[];
  newest: Course[];
  categories: Category[];
  founders: Instructor[];
  continueItem: { course: Course; episode: { id: string; title: string }; progress: WatchProgress } | null;
  session: ClubSession | null;
  pod: AssignedPod | null;
  watches: number;
  onOpenFeed: () => void;
  onOpenCourse: (id: string) => void;
  onOpenCourses: () => void;
  onOpenCategory: (id: string) => void;
  onOpenShorts: () => void;
  onOpenView: (view: 'mylist' | 'history' | 'paths' | 'quiz' | 'instructors') => void;
  onOpenInstructor: (id: string) => void;
  onOpenProfile: (field: string) => void;
  onOpenCalendar: () => void;
  onOpenSession: () => void;
  onWatch: (courseId: string, episodeId: string) => void;
}) {
  const checks = [
    { field: 'profile-name', label: 'שם מלא', done: Boolean(user.name && user.name !== 'אורח/ת') },
    { field: 'profile-avatar', label: 'תמונת פרופיל', done: Boolean(user.avatar) && !user.avatar.includes('images.unsplash.com') },
    { field: 'profile-city', label: 'עיר', done: Boolean(user.city) },
    { field: 'profile-interests', label: 'תחומי עניין', done: user.interests.length > 0 },
  ];
  const missing = checks.filter((item) => !item.done);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const featured = posts[0];
  const when = session ? jerusalemParts(session.startsAt) : null;
  const upcoming = Boolean(session && when && new Date(session.startsAt).getTime() >= Date.now());
  return (
    <div className="pa-home">
      <div className="pa-stream">
        <section className="pa-now" aria-label="מה עושים עכשיו">
          <h2>מה עושים עכשיו</h2>
          <div className="pa-actions">
            {continueItem ? (
              <button type="button" onClick={() => onWatch(continueItem.course.id, continueItem.episode.id)}>
                <span>המשך צפייה</span>
                <strong>{continueItem.course.title}</strong>
              </button>
            ) : (
              <button type="button" onClick={() => onOpenView('quiz')}>
                <span>מה מתאים לי</span>
                <strong>שאלון קצר להרצאה הראשונה</strong>
              </button>
            )}
            {pod ? (
              <button type="button" onClick={onOpenSession}>
                <span>הפוד שלי</span>
                <strong>{pod.name} · שבוע {pod.week} מתוך 33</strong>
              </button>
            ) : null}
            <button type="button" onClick={upcoming && session ? onOpenSession : onOpenCalendar}>
              <span>המפגש הבא</span>
              <strong>{upcoming && session && when ? `${session.title} · ${when.day}.${when.month + 1} ${when.time}` : 'עדיין לא נקבע'}</strong>
            </button>
            <button type="button" onClick={onOpenFeed}>
              <span>הקהילה</span>
              <strong>{featured ? `${featured.author.firstName} · הודעה חדשה` : 'כתבו את ההודעה הראשונה'}</strong>
            </button>
          </div>
        </section>
        <ShelfRow title="ההרצאות שלי" action="כל ההרצאות שלי" onAction={onOpenCourses} empty="ההרצאות שצפיתם יופיעו כאן." emptyAction="מצאו הרצאה" onEmpty={onOpenCourses}>
          {mine.slice(0, 4).map((course) => (
            <button key={course.id} type="button" className="pa-thumb" onClick={() => onOpenCourse(course.id)}>
              {course.coverImage ? <img src={course.coverImage} alt="" /> : null}
              <span>{course.title}</span>
            </button>
          ))}
        </ShelfRow>
        <ShelfRow title="מומלץ לך" action="עוד המלצות" onAction={onOpenCourses} empty="סמנו תחומי עניין כדי לקבל המלצה." emptyAction="לתחומי עניין" onEmpty={() => onOpenProfile('profile-interests')}>
          {recommended.slice(0, 4).map((course) => (
            <button key={course.id} type="button" className="pa-thumb" onClick={() => onOpenCourse(course.id)}>
              {course.coverImage ? <img src={course.coverImage} alt="" /> : null}
              <span>{course.title}</span>
            </button>
          ))}
        </ShelfRow>
        <ShelfRow title="מרצים" action="כל המרצים" onAction={() => onOpenView('instructors')} empty="רשימת המרצים תתעדכן כאן." emptyAction="לכל המרצים" onEmpty={() => onOpenView('instructors')}>
          {instructors.slice(0, 4).map((instructor) => (
            <button key={instructor.id} type="button" className="pa-person" onClick={() => onOpenInstructor(instructor.id)}>
              {instructor.avatarUrl ? <img src={instructor.avatarUrl} alt="" /> : <b>{instructor.name.trim().charAt(0)}</b>}
              <span>{instructor.name}</span>
            </button>
          ))}
        </ShelfRow>
        <button type="button" className="pa-fold" aria-expanded={libraryOpen} onClick={() => setLibraryOpen((value) => !value)}>{libraryOpen ? 'פחות בספרייה' : 'עוד בספרייה'}</button>
        {libraryOpen ? (
        <>
        <ShelfRow title="חדשים" action="לקורסים" onAction={onOpenCourses} empty="הרצאות חדשות יופיעו כאן." emptyAction="לקורסים" onEmpty={onOpenCourses}>
          {newest.slice(0, 4).map((course) => (
            <button key={course.id} type="button" className="pa-thumb" onClick={() => onOpenCourse(course.id)}>
              {course.coverImage ? <img src={course.coverImage} alt="" /> : null}
              <span>{course.title}</span>
            </button>
          ))}
        </ShelfRow>
        <section>
          <div className="pa-rowhead"><h2>קטגוריות</h2></div>
          {categories.length === 0 ? (
            <div className="pa-empty">
              <p className="pa-note">הקטגוריות יופיעו כאן.</p>
              <button type="button" onClick={onOpenCourses}>לקורסים</button>
            </div>
          ) : (
            <div className="pa-chips">
              {categories.slice(0, 12).map((category) => (
                <button key={category.id} type="button" onClick={() => onOpenCategory(category.id)}>{category.name}</button>
              ))}
            </div>
          )}
        </section>
        <ShelfRow title="נבחרת המייסדים" action="לכל המרצים" onAction={() => onOpenView('instructors')} empty="פרופילי המייסדים יופיעו כאן." emptyAction="לכל המרצים" onEmpty={() => onOpenView('instructors')}>
          {founders.slice(0, 8).map((instructor) => (
            <button key={instructor.id} type="button" className="pa-person" onClick={() => onOpenInstructor(instructor.id)}>
              {instructor.avatarUrl ? <img src={instructor.avatarUrl} alt="" /> : <b>{instructor.name.trim().charAt(0)}</b>}
              <span>{instructor.name}</span>
            </button>
          ))}
        </ShelfRow>
        <ShelfRow title="הדרכות קצרות" action="לכל ההדרכות" onAction={onOpenShorts} empty="עוד אין הדרכות קצרות." emptyAction="לקורסים" onEmpty={onOpenCourses}>
          {shorts.slice(0, 8).map((course) => (
            <button key={course.id} type="button" className="pa-thumb" onClick={() => onOpenCourse(course.id)}>
              {course.coverImage ? <img src={course.coverImage} alt="" /> : null}
              <span>{course.title}</span>
            </button>
          ))}
        </ShelfRow>
        <ShelfRow title="הרשימה שלי" action="לרשימה" onAction={() => onOpenView('mylist')} empty="עוד לא שמרתם הרצאות." emptyAction="מצאו הרצאה" onEmpty={onOpenCourses}>
          {saved.slice(0, 4).map((course) => (
            <button key={course.id} type="button" className="pa-thumb" onClick={() => onOpenCourse(course.id)}>
              {course.coverImage ? <img src={course.coverImage} alt="" /> : null}
              <span>{course.title}</span>
            </button>
          ))}
        </ShelfRow>
        <ShelfRow title="היסטוריה" action="להיסטוריה" onAction={() => onOpenView('history')} empty="הצפיות יופיעו כאן אחרי ההרצאה הראשונה." emptyAction="מצאו הרצאה" onEmpty={onOpenCourses}>
          {history.slice(0, 4).map((item) => (
            <button key={`${item.course.id}-${item.episode.id}`} type="button" className="pa-thumb" onClick={() => onWatch(item.course.id, item.episode.id)}>
              {item.course.coverImage ? <img src={item.course.coverImage} alt="" /> : null}
              <span>{item.course.title}</span>
            </button>
          ))}
        </ShelfRow>
        <ShelfRow title="מסלולי למידה" action="למסלולים" onAction={() => onOpenView('paths')} empty="המסלולים יופיעו כאן." emptyAction="למסלולים" onEmpty={() => onOpenView('paths')}>
          {paths.slice(0, 3).map((path) => (
            <button key={path.id} type="button" className="pa-thumb pa-path" onClick={() => onOpenView('paths')}>
              <span>{path.title}</span>
              <em>{path.courseIds.length} קורסים</em>
            </button>
          ))}
        </ShelfRow>
        </>
        ) : null}
      </div>
      {missing.length > 0 ? (
      <aside className="pa-widgets">
        <section className="pa-card">
          <h2>להשלים בפרופיל</h2>
          <div className="pa-checks">
            {missing.map((item) => (
              <button key={item.label} type="button" onClick={() => onOpenProfile(item.field)}>
                <span className="pa-check" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
        </section>
      </aside>
      ) : null}
    </div>
  );
}

function ShelfRow({ title, action, onAction, empty, emptyAction, onEmpty, children }: { title: string; action: string; onAction: () => void; empty: string; emptyAction: string; onEmpty: () => void; children: ReactNode }) {
  const list = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section>
      <div className="pa-rowhead"><h2>{title}</h2>{list.length > 0 ? <button type="button" onClick={onAction}>{action}</button> : null}</div>
      {list.length === 0 ? (
        <div className="pa-empty">
          <p className="pa-note">{empty}</p>
          <button type="button" onClick={onEmpty}>{emptyAction}</button>
        </div>
      ) : <div className="pa-rail">{children}</div>}
    </section>
  );
}

function clock(seconds: number) {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function AreaTop({ initial, query, onQuery }: { initial: string; query: string; onQuery: (value: string) => void }) {
  return (
    <div className="pa-top">
      <span className="community-initial" aria-hidden="true">{initial}</span>
      <a className="pa-wa" href={DEFAULT_WEBINAR_CONFIG.whatsappGroupUrl} target="_blank" rel="noreferrer">לקבוצת הוואטסאפ</a>
      <form className="pa-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="community-sr" htmlFor="pa-find">חיפוש באזור האישי</label>
        <input id="pa-find" type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="חיפוש תכנים או הדרכות" />
      </form>
    </div>
  );
}

export function CourseShelf({ title, courses, noun, onOpen, query = '', onQuery, video = false }: { title: string; courses: Course[]; noun: string; onOpen: (id: string) => void; query?: string; onQuery?: (value: string) => void; video?: boolean }) {
  const [local, setLocal] = useState('');
  const term = onQuery ? query : local;
  const setTerm = onQuery || setLocal;
  const shown = courses.filter((course) => course.title.includes(term.trim()));
  const count = shown.length === 1 ? `${noun} אחת` : `${shown.length} ${noun === 'הרצאה' ? 'הרצאות' : 'הדרכות'}`;
  return (
    <section className={video ? 'pa-shelf pa-videos' : 'pa-shelf'}>
      <div className="pa-rowhead">{title ? <h2>{title}</h2> : null}<span>{count}</span></div>
      {onQuery ? null : <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder={`הקלידו שם של ${noun}`} aria-label={`חיפוש ${noun}`} />}
      {term.trim() && shown.length === 0 ? (
        <div className="pa-empty">
          <p className="pa-note">אין תוצאות עבור «{term.trim()}».</p>
          <button type="button" onClick={() => setTerm('')}>נקו את החיפוש</button>
        </div>
      ) : null}
      <div className="pa-grid">
        {shown.map((course) => (
          <button key={course.id} type="button" className="pa-course" onClick={() => onOpen(course.id)}>
            <span className="pa-cover">
              {course.coverImage ? <img src={course.coverImage} alt="" /> : <span className="pa-fallback" />}
              {video ? <i className="pa-play" aria-hidden="true">▶</i> : null}
              {video && clock(course.episodes.reduce((sum, episode) => sum + (episode.duration || 0), 0)) ? <b className="pa-time">{clock(course.episodes.reduce((sum, episode) => sum + (episode.duration || 0), 0))}</b> : null}
            </span>
            <strong>{course.title}</strong>
            <em>{course.subtitle || course.level}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

export function PodEntry({ pod, onOpen }: { pod: AssignedPod; onOpen: () => void }) {
  return (
    <button type="button" className="pa-card pa-pod" onClick={onOpen}>
      <span>הפוד שלי</span>
      <strong>{pod.name}</strong>
      <em>שבוע {pod.week} מתוך 33 · {pod.role === 'captain' ? 'קפטן' : 'חבר'}</em>
    </button>
  );
}

export function MonthBoard({ sessions }: { sessions: ClubSession[] }) {
  const today = jerusalemParts(new Date().toISOString()) || { year: 2026, month: 10, day: 1, time: '00:00' };
  const [cursor, setCursor] = useState(new Date(today.year, today.month, 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const label = cursor.toLocaleDateString('he-IL', { month: 'long', year: 'numeric', timeZone: 'Asia/Jerusalem' });
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  const marked = new Map<number, ClubSession>();
  sessions.forEach((session) => {
    const parts = jerusalemParts(session.startsAt);
    if (parts && parts.year === year && parts.month === month) marked.set(parts.day, session);
  });
  return (
    <section className="pa-card pa-month" aria-label="לוח חודשי">
      <div className="pa-rowhead">
        <button type="button" className="pa-cal-nav" onClick={() => setCursor(new Date(year, month - 1, 1))}>החודש הקודם</button>
        <h2>{label}</h2>
        <button type="button" className="pa-cal-nav" onClick={() => setCursor(new Date(year, month + 1, 1))}>החודש הבא</button>
      </div>
      <div className="pa-weekdays">{['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="pa-days">
        {cells.map((day, index) => (
          <span key={index} className={`${day === today.day && month === today.month && year === today.year ? 'is-today' : ''} ${day && marked.has(day) ? 'has-event' : ''}`}>
            {day ? (day === today.day && month === today.month && year === today.year ? <i className="pa-today">{day}</i> : day) : ''}
            {day && marked.has(day) ? <em className="pa-chip">{jerusalemParts(marked.get(day)!.startsAt)?.time} {marked.get(day)!.title}</em> : null}
          </span>
        ))}
      </div>
      {marked.size === 0 ? <p className="pa-note">אין מפגש בחודש הזה.</p> : null}
    </section>
  );
}

export function EventList({
  sessions,
  onOpenSession,
  onOpenCalendar,
}: {
  sessions: ClubSession[];
  onOpenSession: () => void;
  onOpenCalendar: () => void;
}) {
  const now = Date.now();
  const upcoming = sessions.filter((session) => new Date(session.startsAt).getTime() >= now);
  const past = sessions.filter((session) => new Date(session.startsAt).getTime() < now);
  return (
    <div className="pa-events">
      <section className="pa-card">
        <h2>המפגשים</h2>
        {upcoming.length === 0 && past.length === 0 ? <p className="pa-note">עדיין אין מפגש בלוח.</p> : null}
        {upcoming.map((session) => {
          const parts = jerusalemParts(session.startsAt);
          return (
            <button key={session.startsAt} type="button" className="pa-event pa-meet" onClick={onOpenSession}>
              <span className="community-initial" aria-hidden="true">{session.title.trim().charAt(0)}</span>
              <span><strong>{session.title}</strong><em>{parts ? `${parts.day}.${parts.month + 1} · ${parts.time}` : 'מפגש קרוב'}</em></span>
            </button>
          );
        })}
        {past.map((session) => {
          const parts = jerusalemParts(session.startsAt);
          return (
            <article key={session.startsAt} className="pa-course pa-recording">
              <span className="pa-cover"><span className="pa-fallback" /><i className="pa-play" aria-hidden="true">▶</i>{parts ? <b className="pa-time">{parts.day}.{parts.month + 1}</b> : null}</span>
              <strong>{session.title}</strong>
              <em>ההקלטה תתווסף כשהיא מוכנה</em>
            </article>
          );
        })}
        <button type="button" className="community-publish" onClick={onOpenCalendar}>ללוח</button>
      </section>
    </div>
  );
}

export function AgentGrid({ onContact }: { onContact: () => void }) {
  return (
    <div className="pa-agent-grid">
      {AGENTS.map((item) => (
        <article key={item.name} className="pa-agent">
          <em>{item.tone}</em>
          <h3>{item.name}</h3>
          <p>{item.text}</p>
          <button type="button" onClick={onContact}>פנייה לצוות</button>
        </article>
      ))}
    </div>
  );
}

function postTime(value: string) {
  const then = new Date(`${value.replace(' ', 'T')}Z`).getTime();
  return Number.isNaN(then) ? 0 : then;
}

export function HallOfFame({ user, posts, watches }: { user: UserProfile; posts: CommunityPost[]; watches: number }) {
  const [range, setRange] = useState<'all' | 'month' | 'week'>('all');
  const activity = memberActivity(user, posts, watches);
  const rows = useMemo(() => {
    const limit = range === 'week' ? 7 : range === 'month' ? 31 : 0;
    const cutoff = limit ? Date.now() - limit * 86400000 : 0;
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      if (cutoff && postTime(post.createdAt) < cutoff) return;
      const name = post.author.firstName || 'חבר';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const mine = user.name.split(' ')[0] || 'אתם';
    if (!counts.has(mine)) counts.set(mine, 0);
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'he'));
  }, [posts, range, user.name]);
  const place = rows.findIndex((row) => row.name === (user.name.split(' ')[0] || 'אתם')) + 1;
  const peak = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="pa-hall">
      <section className="pa-card pa-profile">
        <div className="pa-avatar lg" aria-hidden="true">{(user.name.trim().charAt(0) || 'ח')}</div>
        <h2>{user.name.split(' ')[0] || 'אתם'}</h2>
        <p className="pa-note">המקום לפי הודעות בקהילה</p>
        <div className="pa-stats">
          <div>המקום שלכם<b>{place || '—'}</b></div>
          <div>הודעות<b>{activity.posts}</b></div>
        </div>
      </section>
      <div className="pa-hall-board">
        <section className="pa-card">
          <div className="pa-tabs">
            {([['all', 'כל הזמנים'], ['month', 'חודשי'], ['week', 'שבועי']] as const).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={range === id} onClick={() => setRange(id)}>{label}</button>
            ))}
          </div>
          <ol className="pa-board">
            {rows.map((row, index) => (
              <li key={row.name}>
                <b>{index + 1}</b>
                <span>{row.name}</span>
                <i style={{ width: `${Math.max(8, Math.round((row.count / peak) * 100))}%` }} />
                <em>{row.count === 1 ? 'הודעה אחת' : `${row.count} הודעות`}</em>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

export function Partners({ userId }: { userId: string }) {
  const link = `${window.location.origin}/library?ref=${userId.slice(0, 8)}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="pa-partners">
      <section className="pa-hero">
        <div>
          <h2>תוכנית שותפים</h2>
          <p>שולחים קישור לחבר. הספירה תיפתח אחר כך.</p>
        </div>
      </section>
      <section className="pa-card">
        <p className="pa-link">{link}</p>
        <button type="button" onClick={() => { void navigator.clipboard.writeText(link).then(() => setCopied(true)); }}>
          {copied ? 'הקישור הועתק' : 'העתיקו את הקישור'}
        </button>
      </section>
      <div className="pa-steps">
        <article><b>1</b><p>מעתיקים את הקישור</p></article>
        <article><b>2</b><p>חבר נרשם דרכו</p></article>
        <article><b>3</b><p>הספירה תופיע כאן</p></article>
      </div>
      <div className="pa-metrics">
        <article><span>נרשמו דרככם</span><b>—</b><em>הספירה תיפתח</em></article>
        <article><span>ממתינים</span><b>—</b></article>
      </div>
    </div>
  );
}

export function ContactDesk() {
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState('');
  return (
    <div className="pa-contact">
      <section className="pa-hero">
        <div>
          <h2>צור קשר ותמיכה</h2>
          <p>אנחנו כאן לכל שאלה.</p>
        </div>
      </section>
      <div className="pa-contact-cards">
        <a href={DEFAULT_WEBINAR_CONFIG.whatsappGroupUrl} target="_blank" rel="noreferrer"><b>וואטסאפ</b><span>נפתח בוואטסאפ</span></a>
        <a href="/#faq"><b>שאלות נפוצות</b><span>נפתח בעמוד השאלות</span></a>
        <a href="mailto:support@infinitemasterpiece.local"><b>מייל</b><span>נפתח המייל</span></a>
      </div>
      <form className="pa-card" onSubmit={(event) => {
        event.preventDefault();
        if (note.trim().length < 2) {
          setHint('כתבו משפט אחד');
          return;
        }
        setHint('');
        window.location.href = `mailto:support@infinitemasterpiece.local?subject=${encodeURIComponent(`פנייה · ${stars} כוכבים`)}&body=${encodeURIComponent(note.trim())}`;
        setSent(true);
      }}>
        <h2>שלחו לנו משוב</h2>
        <div className="pa-stars" role="group" aria-label="דירוג מ־1 עד 5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" aria-pressed={stars >= value} aria-label={`${value} כוכבים`} onClick={() => setStars(value)}>★</button>
          ))}
        </div>
        <label htmlFor="pa-note">מה תרצו לספר לנו</label>
        <textarea id="pa-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="מה תרצו לספר לנו" />
        <button type="submit">פתיחת המייל</button>
        {hint ? <p role="alert">{hint}</p> : null}
        {sent ? <p>חלון המייל נפתח עם המשוב.</p> : null}
      </form>
    </div>
  );
}

export function ClubCard({ plan, trialEndsAt }: { plan: string; trialEndsAt?: string }) {
  const labels: Record<string, string> = {
    none: 'ללא מנוי',
    free_trial: 'ניסיון',
    monthly: 'מנוי חודשי',
    annual: 'מנוי שנתי',
    premium_88: 'נבחרת 88',
  };
  const active = plan === 'monthly' || plan === 'annual' || plan === 'premium_88';
  return (
    <div className="pa-club">
      <section className="pa-hero">
        <div>
          <h2>המועדון</h2>
          <p>{active ? 'המסלול הפעיל פותח את הספרייה ואת הקהילה.' : 'בחירת מסלול פותחת את הספרייה ואת הקהילה.'}</p>
        </div>
      </section>
      <section className="pa-card">
        <p className="pa-note">המסלול הפעיל</p>
        <h2>{labels[plan] || plan}</h2>
        {plan === 'free_trial' && trialEndsAt ? <p>בתוקף עד {trialEndsAt}</p> : null}
        <Link to="/pricing" className="community-publish">שינוי תוכנית</Link>
      </section>
    </div>
  );
}
