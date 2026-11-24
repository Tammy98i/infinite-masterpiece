import { useMemo, useState, type ReactNode } from 'react';
import type { CommunityPost } from '../../api/community';
import type { Course, Instructor, LearningPath, UserProfile, WatchProgress } from '../../types';

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

const LEVELS = [
  { name: 'מתחיל', min: 0 },
  { name: 'פעיל', min: 200 },
  { name: 'מוביל', min: 800 },
  { name: 'מנטור', min: 1500 },
];

function levelFor(points: number) {
  return [...LEVELS].reverse().find((level) => points >= level.min) || LEVELS[0];
}

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
  return { posts: mine, watches, points: watches * 10 + mine * 20 };
}

export function HomeDesk({
  user,
  posts,
  shorts,
  saved,
  history,
  paths,
  instructors,
  continueItem,
  session,
  pod,
  watches,
  onOpenFeed,
  onOpenCourse,
  onOpenCourses,
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
  continueItem: { course: Course; episode: { id: string; title: string }; progress: WatchProgress } | null;
  session: ClubSession | null;
  pod: AssignedPod | null;
  watches: number;
  onOpenFeed: () => void;
  onOpenCourse: (id: string) => void;
  onOpenCourses: () => void;
  onOpenShorts: () => void;
  onOpenView: (view: 'mylist' | 'history' | 'paths' | 'quiz' | 'instructors') => void;
  onOpenInstructor: (id: string) => void;
  onOpenProfile: () => void;
  onOpenCalendar: () => void;
  onOpenSession: () => void;
  onWatch: (courseId: string, episodeId: string) => void;
}) {
  const checks = [
    { label: 'שם מלא', done: Boolean(user.name && user.name !== 'אורח/ת') },
    { label: 'תמונת פרופיל', done: Boolean(user.avatar) },
    { label: 'עיר', done: Boolean(user.city) },
    { label: 'תחומי עניין', done: user.interests.length > 0 },
  ];
  const done = checks.filter((item) => item.done).length;
  const featured = posts[0];
  const activity = memberActivity(user, posts, watches);
  const when = session ? jerusalemParts(session.startsAt) : null;
  const upcoming = Boolean(session && when && new Date(session.startsAt).getTime() >= Date.now());
  return (
    <div className="pa-home">
      <div className="pa-stream">
        <div className="pa-now">
          {continueItem ? (
            <button type="button" className="pa-card pa-continue" onClick={() => onWatch(continueItem.course.id, continueItem.episode.id)}>
              <span>המשך צפייה</span>
              <strong>{continueItem.course.title}</strong>
              <em>{continueItem.episode.title}</em>
              <i style={{ width: `${Math.max(4, Math.round((continueItem.progress.currentTime / Math.max(1, continueItem.progress.duration)) * 100))}%` }} />
            </button>
          ) : (
            <button type="button" className="pa-card pa-quiz" onClick={() => onOpenView('quiz')}>
              <strong>מה מתאים לי</strong>
              <span>עוד אין הרצאה פעילה. השאלון הקצר מכוון להרצאה הראשונה.</span>
            </button>
          )}
          {pod ? <PodEntry pod={pod} onOpen={onOpenSession} /> : null}
          {upcoming && session && when ? (
            <button type="button" className="pa-card" onClick={onOpenSession}>
              <span>המפגש הקרוב</span>
              <strong>{session.title}</strong>
              <em>{when.day}.{when.month + 1} · {when.time}</em>
            </button>
          ) : (
            <button type="button" className="pa-card" onClick={onOpenCalendar}>
              <strong>המפגש הבא</strong>
              <span>עוד אין מפגש בלוח. הוא יופיע כאן ברגע שייקבע.</span>
            </button>
          )}
          {featured ? (
            <article className="pa-card pa-pulse">
              <p>{featured.author.firstName}</p>
              <h2>{featured.body}</h2>
              <button type="button" onClick={onOpenFeed}>לדיון</button>
            </article>
          ) : (
            <button type="button" className="pa-card" onClick={onOpenFeed}>שתפו את הפוסט הראשון בקהילה</button>
          )}
        </div>
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
        <ShelfRow title="מומחים ומרצים" action="לכל המרצים" onAction={() => onOpenView('instructors')} empty="רשימת המרצים תתעדכן כאן." emptyAction="לכל המרצים" onEmpty={() => onOpenView('instructors')}>
          {instructors.slice(0, 8).map((instructor) => (
            <button key={instructor.id} type="button" className="pa-person" onClick={() => onOpenInstructor(instructor.id)}>
              {instructor.avatarUrl ? <img src={instructor.avatarUrl} alt="" /> : <b>{instructor.name.trim().charAt(0)}</b>}
              <span>{instructor.name}</span>
            </button>
          ))}
        </ShelfRow>
      </div>
      <aside className="pa-widgets">
        <section className="pa-card">
          <h2>השלמת הפרופיל שלך</h2>
          <p className="pa-progress-label">{done}/{checks.length}</p>
          <div className="pa-bar"><span style={{ width: `${(done / checks.length) * 100}%` }} /></div>
          <div className="pa-checks">
            {checks.map((item) => (
              <button key={item.label} type="button" className={item.done ? 'is-done' : ''} onClick={onOpenProfile}>
                <span className="pa-check" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
        </section>
        <section className="pa-card">
          <h2>הפעילות שלך</h2>
          <p className="pa-points">{activity.points}</p>
          <p>{levelFor(activity.points).name} · {activity.watches} צפיות · {activity.posts} פוסטים</p>
        </section>
      </aside>
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

export function CourseShelf({ title, courses, onOpen }: { title: string; courses: Course[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const shown = courses.filter((course) => course.title.includes(query.trim()));
  return (
    <section className="pa-shelf">
      <div className="pa-rowhead"><h2>{title}</h2><span>{shown.length} פריטים</span></div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש לפי שם" aria-label="חיפוש" />
      {query.trim() && shown.length === 0 ? (
        <div className="pa-empty">
          <p className="pa-note">אין תוצאות עבור «{query.trim()}».</p>
          <button type="button" onClick={() => setQuery('')}>נקו את החיפוש</button>
        </div>
      ) : null}
      <div className="pa-grid">
        {shown.map((course) => (
          <button key={course.id} type="button" className="pa-course" onClick={() => onOpen(course.id)}>
            {course.coverImage ? <img src={course.coverImage} alt="" /> : <span className="pa-fallback" />}
            <strong>{course.title}</strong>
            <em>{course.level}</em>
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
  const marked = new Map<number, string>();
  sessions.forEach((session) => {
    const parts = jerusalemParts(session.startsAt);
    if (parts && parts.year === year && parts.month === month) marked.set(parts.day, `${parts.time} ${session.title}`);
  });
  return (
    <section className="pa-card pa-month" aria-label="לוח חודשי">
      <div className="pa-rowhead">
        <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="חודש קודם">‹</button>
        <h2>{label}</h2>
        <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="חודש הבא">›</button>
      </div>
      <div className="pa-weekdays">{['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="pa-days">
        {cells.map((day, index) => (
          <span key={index} className={`${day === today.day && month === today.month && year === today.year ? 'is-today' : ''} ${day && marked.has(day) ? 'has-event' : ''}`}>
            {day || ''}
            {day && marked.has(day) ? <small>{marked.get(day)}</small> : null}
          </span>
        ))}
      </div>
      {marked.size === 0 ? <p className="pa-note">אין מפגש מתוזמן בחודש הזה.</p> : null}
    </section>
  );
}

export function EventList({
  sessions,
  watched,
  onOpenSession,
  onOpenCalendar,
  onOpenCourse,
  onFind,
}: {
  sessions: ClubSession[];
  watched: Array<{ course: Course; episode: { id: string; title: string } }>;
  onOpenSession: () => void;
  onOpenCalendar: () => void;
  onOpenCourse: (id: string) => void;
  onFind: () => void;
}) {
  const now = Date.now();
  const upcoming = sessions.filter((session) => new Date(session.startsAt).getTime() >= now);
  const past = sessions.filter((session) => new Date(session.startsAt).getTime() < now);
  return (
    <div className="pa-events">
      <section className="pa-card">
        <h2>מפגשים קרובים</h2>
        {upcoming.length === 0 ? (
          <div className="pa-empty">
            <p className="pa-note">אין מפגש קרוב בלוח.</p>
            <button type="button" onClick={onOpenCalendar}>ללוח החודשי</button>
          </div>
        ) : upcoming.map((session) => {
          const parts = jerusalemParts(session.startsAt);
          return (
            <button key={session.startsAt} type="button" className="pa-event" onClick={onOpenSession}>
              <span className="pa-avatar">{session.title.trim().charAt(0)}</span>
              <span><strong>{session.title}</strong><em>{session.notes || 'מפגש הפוד'}</em></span>
              <time>{parts?.time}</time>
              <b>{parts ? `${parts.day}.${parts.month + 1}` : ''}</b>
            </button>
          );
        })}
      </section>
      <section className="pa-card">
        <h2>מפגשים שהתקיימו</h2>
        {past.length === 0 ? <p className="pa-note">הקלטות המפגשים יופיעו כאן אחרי שיתקיימו.</p> : past.map((session) => {
          const parts = jerusalemParts(session.startsAt);
          return <p key={session.startsAt}>{session.title}{parts ? ` · ${parts.day}.${parts.month + 1}` : ''}</p>;
        })}
      </section>
      <section>
        <h2>צפייה אחרונה בספרייה</h2>
        {watched.length === 0 ? (
          <div className="pa-empty">
            <p className="pa-note">עוד אין צפייה שמורה.</p>
            <button type="button" onClick={onFind}>מצאו הרצאה</button>
          </div>
        ) : (
          <div className="pa-rail">
            {watched.slice(0, 6).map((item) => (
              <button key={`${item.course.id}-${item.episode.id}`} type="button" className="pa-thumb" onClick={() => onOpenCourse(item.course.id)}>
                {item.course.coverImage ? <img src={item.course.coverImage} alt="" /> : null}
                <span>{item.episode.title}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function AgentGrid({ onContact }: { onContact: () => void }) {
  return (
    <section className="pa-agents">
      <div className="pa-rowhead"><h2>סוכני AI</h2><span>ייפתחו בהמשך</span></div>
      <p className="pa-note">הסוכנים עדיין לא מפיקים תשובה. בינתיים אפשר לפנות לצוות, והבקשה מגיעה לאדם.</p>
      <div className="pa-grid">
        {AGENTS.map((item) => (
          <article key={item.name} className="pa-agent">
            <div className="pa-agent-art">{item.tone}</div>
            <h3>{item.name}</h3>
            <p>{item.text}</p>
            <button type="button" onClick={onContact}>פנייה לצוות</button>
          </article>
        ))}
      </div>
    </section>
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
      .map(([name, count]) => ({ name, points: count * 20 }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'he'));
  }, [posts, range, user.name]);
  const top = rows[0]?.points || 1;
  const place = rows.findIndex((row) => row.name === (user.name.split(' ')[0] || 'אתם')) + 1;
  return (
    <div className="pa-hall">
      <section className="pa-card pa-profile">
        <div className="pa-avatar lg">{(user.name || 'ח').trim().charAt(0)}</div>
        <h2>{user.name}</h2>
        <p>{place ? `מקום ${place} לפי פוסטים שפורסמו` : 'עוד אין דירוג'}</p>
        <div className="pa-stats">
          <div><b>{levelFor(activity.points).name}</b><span>דרגה</span></div>
          <div><b>{activity.points}</b><span>מצפייה ומפוסטים</span></div>
        </div>
      </section>
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
              <i style={{ width: `${Math.max(8, (row.points / top) * 100)}%` }} />
              <em>{row.points}</em>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function Partners({ userId }: { userId: string }) {
  const link = `${window.location.origin}/library?ref=${userId.slice(0, 8)}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="pa-partners">
      <section className="pa-card pa-partner-hero">
        <h2>תוכנית שותפים</h2>
        <p>אפשר להעתיק קישור אישי. ספירת הנרשמים והקרדיט ייפתחו בהמשך, ולכן אין כאן מספרים.</p>
      </section>
      <section className="pa-card">
        <h2>הקישור שלי</h2>
        <p className="pa-link">{link}</p>
        <button type="button" onClick={() => { void navigator.clipboard.writeText(link).then(() => setCopied(true)); }}>
          {copied ? 'הועתק' : 'העתקת קישור'}
        </button>
      </section>
      <div className="pa-steps">
        <article><b>1</b><p>שתפו את הקישור</p></article>
        <article><b>2</b><p>חבר חדש נרשם</p></article>
        <article><b>3</b><p>הקרדיט ייספר כשהמעקב ייפתח</p></article>
      </div>
    </div>
  );
}

export function ContactDesk() {
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <div className="pa-contact">
      <section className="pa-contact-hero"><h2>צור קשר ותמיכה</h2><p>אנחנו כאן לעזור לך לאורך כל הדרך</p></section>
      <div className="pa-contact-cards">
        <article><b>קהילת הוואטסאפ</b><span>הצטרפות לקבוצה הרשמית</span></article>
        <article><b>מרכז הידע</b><span>שאלות נפוצות על הספרייה</span></article>
        <article><b>תמיכה במייל</b><span>support@infinitemasterpiece.local</span></article>
      </div>
      <form className="pa-card" onSubmit={(event) => {
        event.preventDefault();
        if (note.trim().length < 2) return;
        window.location.href = `mailto:support@infinitemasterpiece.local?subject=${encodeURIComponent(`פנייה · ${stars} כוכבים`)}&body=${encodeURIComponent(note.trim())}`;
        setSent(true);
      }}>
        <h2>שלחו לנו משוב</h2>
        <p>איך הייתם מדרגים את החוויה?</p>
        <div className="pa-stars">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" aria-pressed={stars >= value} onClick={() => setStars(value)}>★</button>
          ))}
        </div>
        <label htmlFor="pa-note">כתבו אימייל</label>
        <textarea id="pa-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="ספרו מה עבד ומה לשפר" />
        <button type="submit">שליחת משוב</button>
        {sent ? <p>חלון המייל נפתח עם המשוב.</p> : null}
      </form>
    </div>
  );
}

export function ClubCard({ plan }: { plan: string }) {
  const labels: Record<string, string> = {
    none: 'ללא מנוי',
    free_trial: 'ניסיון',
    monthly: 'מנוי חודשי',
    annual: 'מנוי שנתי',
    premium_88: 'נבחרת 88',
  };
  return (
    <section className="pa-card pa-club">
      <h2>המועדון</h2>
      <p>המסלול הפעיל: {labels[plan] || plan}</p>
      <ul>
        <li>שיחה בקהילה וכתיבה</li>
        <li>לוח מפגשים והקלטות</li>
        <li>הדרכות קצרות וקורסים</li>
        <li>נקודות ודירוג בהיכל התהילה</li>
      </ul>
    </section>
  );
}
