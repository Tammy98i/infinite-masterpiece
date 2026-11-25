import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  const mine = posts.filter((post) => post.mine).length;
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
  onOpenHall,
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
  savedIds = [],
  onToggleSave,
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
  onOpenHall: () => void;
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
  savedIds: string[];
  onToggleSave: (courseId: string) => void;
  onPublish: (input: { body: string; lectureTitle?: string; imageUrl?: string }) => Promise<void>;
  onReact: (postId: string) => Promise<void>;
  onReply: (postId: string, text: string) => Promise<void>;
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
  const portrait = user.avatar && !user.avatar.includes('images.unsplash.com') ? user.avatar : '';
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!session?.startsAt) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [session?.startsAt]);
  const when = session ? jerusalemParts(session.startsAt) : null;
  const upcoming = Boolean(session && when && new Date(session.startsAt).getTime() > now);
  const names = new Map<string, number>();
  posts.forEach((post) => {
    const name = post.author.firstName || 'חבר';
    names.set(name, (names.get(name) || 0) + 1);
  });
  const board = [...names.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'he')).slice(0, 5);
  const resume = continueItem
    ? continueItem.course.episodes.find((episode) => episode.id === continueItem.episode.id) || continueItem.course.episodes[0]
    : undefined;
  const starter = continueItem ? null : (recommended.length ? recommended : newest).find((course) => course.episodes[0]);
  const focus = continueItem?.course || starter || null;
  const focusEpisode = resume || starter?.episodes[0];
  const teacher = instructors.find((person) => person.id === focus?.instructorId)?.name || '';
  const focusMinutes = focusEpisode ? Math.max(1, Math.round((focusEpisode.duration || 0) / 60)) : 0;
  const missingAction: Record<string, string> = {
    'profile-name': 'הוספת שם',
    'profile-avatar': 'הוספת תמונה',
    'profile-city': 'הוספת עיר',
    'profile-interests': 'בחירת תחומי עניין',
  };
  const nextMissing = missing[0];
  return (
    <div className="pa-dash">
      <div className="pa-stream">
        <section className="pa-now" aria-label="מה אפשר לעשות עכשיו">
          {focus && focusEpisode ? (
            <>
              <button type="button" className="pa-now-cover" onClick={() => onWatch(focus.id, focusEpisode.id)}>
                {focus.coverImage ? <img src={focus.coverImage} alt="" /> : <span className="pa-fallback" />}
              </button>
              <div>
                <span>{continueItem ? 'המשך צפייה' : 'הרצאת פתיחה'}</span>
                <h2>{focus.title}</h2>
                <p>{[continueItem ? continueItem.episode.title : '', teacher, focusMinutes ? `${focusMinutes} דקות` : ''].filter(Boolean).join(' · ')}</p>
                <button type="button" className="community-publish" onClick={() => onWatch(focus.id, focusEpisode.id)}>{continueItem ? 'המשך צפייה' : 'לצפייה'}</button>
              </div>
            </>
          ) : (
            <>
              <h2>עדיין אין הרצאה פתוחה</h2>
              <button type="button" className="community-publish" onClick={onOpenCourses}>כל הקורסים</button>
            </>
          )}
        </section>
        <div className="pa-updates">
          {upcoming && session && when ? (
            <p className="pa-update"><span>{session.title} · {when.day}.{when.month + 1} · {when.time}</span><button type="button" onClick={pod ? onOpenSession : onOpenCalendar}>הרשמה</button></p>
          ) : <p className="pa-note">אין מפגש מתוכנן.</p>}
          {featured ? (
            <p className="pa-update"><span>{featured.author.firstName}: {featured.body}</span><button type="button" onClick={onOpenFeed}>לקהילה</button></p>
          ) : <p className="pa-note">עדיין אין עדכון מהקהילה.</p>}
        </div>
        <section>
          <div className="pa-rowhead"><h2>מומלץ לך</h2><button type="button" onClick={onOpenCourses}>כל הקורסים</button></div>
          <div className="pa-lessons">
            {(recommended.length ? recommended : mine).slice(0, 4).map((course) => {
              const minutes = Math.max(1, Math.round((course.episodes || []).reduce((sum, episode) => sum + (episode.duration || 0), 0) / 60));
              const name = instructors.find((person) => person.id === course.instructorId)?.name;
              return (
                <article key={course.id} className="pa-lesson">
                  <button type="button" className="pa-lesson-open" onClick={() => onOpenCourse(course.id)}>
                    {course.coverImage ? <img src={course.coverImage} alt="" /> : <span className="pa-fallback" />}
                    <span><strong>{course.title}</strong><em>{[name, `${minutes} דקות`].filter(Boolean).join(' · ')}</em></span>
                  </button>
                  <button type="button" className="pa-pin" aria-pressed={savedIds.includes(course.id)} onClick={() => onToggleSave(course.id)}>{savedIds.includes(course.id) ? 'נשמר' : 'שמירה'}</button>
                </article>
              );
            })}
          </div>
        </section>
        <section className="pa-account">
          {portrait ? <img className="pa-avatar pa-face" src={portrait} alt="" /> : <div className="pa-avatar" aria-hidden="true">{user.name.trim().charAt(0) || 'ח'}</div>}
          <div>
            <strong>{user.name || 'חשבון'}</strong>
            {nextMissing ? <p className="pa-note">חסר: {nextMissing.label}</p> : <p className="pa-note">הפרופיל מלא</p>}
          </div>
          <button type="button" onClick={() => onOpenProfile(nextMissing?.field || 'profile-name')}>{nextMissing ? missingAction[nextMissing.field] : 'לפרופיל'}</button>
        </section>
        <button type="button" className="pa-fold" aria-expanded={libraryOpen} onClick={() => setLibraryOpen((value) => !value)}>{libraryOpen ? 'פחות בספרייה' : 'עוד בספרייה'}</button>
        {libraryOpen ? (
        <>
        <ShelfRow title="ההרצאות שלי" action="כל ההרצאות שלי" onAction={onOpenCourses} empty="ההרצאות שצפיתם יופיעו כאן." emptyAction="מצאו הרצאה" onEmpty={onOpenCourses}>
          {mine.slice(0, 4).map((course) => (
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
      <aside className="pa-context">
        <section className="pa-card">
          <h2>מה חדש</h2>
          {newest.slice(0, 3).map((course) => (
            <button key={course.id} type="button" className="pa-news" onClick={() => onOpenCourse(course.id)}>
              {course.coverImage ? <img src={course.coverImage} alt="" /> : <i />}
              <span>{course.title}</span>
              <b aria-hidden="true">‹</b>
            </button>
          ))}
          {newest.length === 0 ? <p className="pa-note">הרצאות חדשות יופיעו כאן.</p> : null}
        </section>
        <section className="pa-card">
          <div className="pa-rowhead"><h2>היכל</h2><button type="button" onClick={onOpenHall}>להיכל</button></div>
          {board.length === 0 ? <p className="pa-note">עוד אין הודעות לדירוג.</p> : board.map(([name, count], index) => (
            <p key={name} className="pa-rankline"><b>{index + 1}</b><span>{name}</span><em>{count === 1 ? 'הודעה אחת' : `${count} הודעות`}</em></p>
          ))}
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

function clock(seconds: number) {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function AreaTop({ initial, name, avatar, query, onQuery, onBoard, onProfile }: { initial: string; name: string; avatar?: string; query: string; onQuery: (value: string) => void; onBoard: () => void; onProfile: () => void }) {
  return (
    <div className="pa-top">
      <form className="pa-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="community-sr" htmlFor="pa-find">חיפוש באזור האישי</label>
        <input id="pa-find" type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="חיפוש הרצאה, מפגש או מילה מהשיחה" />
      </form>
      <a className="pa-wa" href={DEFAULT_WEBINAR_CONFIG.whatsappGroupUrl} target="_blank" rel="noreferrer" aria-label="הצטרפות לקבוצת הוואטסאפ">ו</a>
      <button type="button" className="pa-board-btn" onClick={onBoard}>הקהילה</button>
      <button type="button" className="pa-who" onClick={onProfile}>
        {avatar ? <img src={avatar} alt="" /> : <span className="community-initial" aria-hidden="true">{initial}</span>}
        <strong>{name}</strong>
      </button>
    </div>
  );
}

export function CourseShelf({ title, courses, noun, onOpen, query = '', onQuery, video = false, categories = [], showFilters = true }: { title: string; courses: Course[]; noun: string; onOpen: (id: string) => void; query?: string; onQuery?: (value: string) => void; video?: boolean; categories?: Array<{ id: string; name: string }>; showFilters?: boolean }) {
  const [local, setLocal] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const term = onQuery ? query : local;
  const setTerm = onQuery || setLocal;
  const shown = courses.filter((course) => course.title.includes(term.trim()) && (!categoryId || course.categoryId === categoryId));
  const count = shown.length === 1 ? `${noun} אחת` : `${shown.length} ${noun === 'הרצאה' ? 'הרצאות' : 'הדרכות'}`;
  return (
    <section className={`${video ? 'pa-shelf pa-videos' : 'pa-shelf'}${filtersOpen ? ' is-filtered' : ''}`}>
      <div className="pa-rowhead">{title ? <h2>{title}</h2> : null}<span>{count}</span></div>
      {showFilters && categories.length > 0 ? (
        <>
          <button type="button" className="pa-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}>{filtersOpen ? 'סגירת הסינון' : 'סינון'}</button>
          <div className="pa-chips">
            <button type="button" aria-pressed={!categoryId} onClick={() => setCategoryId('')}>כל הנושאים</button>
            {categories.map((category) => (
              <button key={category.id} type="button" aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}>{category.name}</button>
            ))}
          </div>
        </>
      ) : null}
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
  const upcoming = sessions
    .filter((session) => new Date(session.startsAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  const upcomingParts = upcoming ? jerusalemParts(upcoming.startsAt) : null;
  return (
    <section className="pa-card pa-month" aria-label="לוח חודשי">
      {upcoming && upcomingParts ? (
        <p className="pa-update"><span>{upcoming.title} · {upcomingParts.day}.{upcomingParts.month + 1} · {upcomingParts.time}</span></p>
      ) : <p className="pa-note">אין מפגש מתוכנן.</p>}
      {marked.size === 0 ? <p className="pa-note">אין מפגשים החודש.</p> : null}
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
            {day && marked.has(day) ? <i className="pa-dot" aria-hidden="true" /> : null}
          </span>
        ))}
      </div>
      {marked.size > 0 ? (
        <ul className="pa-month-list">
          {[...marked.entries()].map(([day, session]) => {
            const parts = jerusalemParts(session.startsAt);
            return <li key={day}>{day}.{month + 1} · {parts?.time} · {session.title}</li>;
          })}
        </ul>
      ) : null}
    </section>
  );
}

export function EventList({
  sessions,
  onOpenSession,
  onOpenCalendar,
  suggestion,
}: {
  sessions: ClubSession[];
  onOpenSession: () => void;
  onOpenCalendar: () => void;
  suggestion?: { title: string; onOpen: () => void } | null;
}) {
  const now = Date.now();
  const [scope, setScope] = useState<'all' | 'soon' | 'past'>('past');
  const upcoming = sessions.filter((session) => new Date(session.startsAt).getTime() >= now);
  const past = sessions.filter((session) => new Date(session.startsAt).getTime() < now);
  const showSoon = scope !== 'past';
  const showPast = scope !== 'soon';
  return (
    <div className="pa-events">
      <div className="pa-chips">
        <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>כל המפגשים</button>
        <button type="button" aria-pressed={scope === 'soon'} onClick={() => setScope('soon')}>קרובים</button>
        <button type="button" aria-pressed={scope === 'past'} onClick={() => setScope('past')}>שעברו</button>
      </div>
      <section className="pa-card">
        <h2>הקלטות זמינות לצפייה</h2>
        {past.length === 0 && scope !== 'soon' ? (
          <div className="pa-empty">
            <p className="pa-note">עדיין אין הקלטה מוכנה.</p>
            {suggestion ? <button type="button" className="community-publish" onClick={suggestion.onOpen}>{suggestion.title}</button> : <button type="button" onClick={onOpenCalendar}>ללוח</button>}
          </div>
        ) : null}
        {showSoon ? upcoming.map((session) => {
          const parts = jerusalemParts(session.startsAt);
          return (
            <button key={session.startsAt} type="button" className="pa-event pa-meet" onClick={onOpenSession}>
              <span className="community-initial" aria-hidden="true">{session.title.trim().charAt(0)}</span>
              <span><strong>{session.title}</strong><em>{parts ? `${parts.day}.${parts.month + 1} · ${parts.time}` : 'מפגש קרוב'}</em></span>
            </button>
          );
        }) : null}
        {showPast ? past.map((session) => {
          const parts = jerusalemParts(session.startsAt);
          return (
            <article key={session.startsAt} className="pa-course pa-recording">
              <span className="pa-cover"><span className="pa-fallback" />{parts ? <b className="pa-time">{parts.day}.{parts.month + 1}</b> : null}</span>
              <strong>{session.title}</strong>
              <em>ההקלטה תתווסף כשהיא מוכנה</em>
            </article>
          );
        }) : null}
        <button type="button" className="community-publish" onClick={onOpenCalendar}>ללוח</button>
      </section>
    </div>
  );
}

export function AgentGrid({ onContact }: { onContact: () => void }) {
  return (
    <div className="pa-agent-grid">
      <section className="pa-card pa-agent-note">
        <h2>הסוכנים בפיתוח</h2>
        <p>הכלים האלה עדיין לא פעילים. פנייה אחת מגיעה לצוות.</p>
        <button type="button" className="community-publish" onClick={onContact}>פנייה לצוות</button>
      </section>
      {AGENTS.map((item) => (
        <article key={item.name} className="pa-agent">
          <em>{item.tone}</em>
          <h3>{item.name}</h3>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  );
}

function postTime(value: string) {
  const then = new Date(`${value.replace(' ', 'T')}Z`).getTime();
  return Number.isNaN(then) ? 0 : then;
}

export function HallOfFame({ user, posts, watches, onWrite }: { user: UserProfile; posts: CommunityPost[]; watches: number; onWrite: () => void }) {
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
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'he'));
  }, [posts, range]);
  const ranked = rows.reduce<Array<{ name: string; count: number; place: number }>>((list, row) => {
    const previous = list[list.length - 1];
    const place = previous && previous.count === row.count ? previous.place : list.length + 1;
    list.push({ ...row, place });
    return list;
  }, []);
  const peak = Math.max(1, ...ranked.map((row) => row.count));
  const mineName = user.name.split(' ')[0] || 'אתם';
  const mineRow = ranked.find((row) => row.name === mineName);
  const portrait = user.avatar && !user.avatar.includes('images.unsplash.com') ? user.avatar : '';
  return (
    <div className="pa-hall">
      <section className="pa-card pa-profile">
        {portrait ? <img className="pa-avatar lg pa-face" src={portrait} alt="" /> : <div className="pa-avatar lg" aria-hidden="true">{user.name.trim().charAt(0) || 'ח'}</div>}
        <h2>{user.name}</h2>
        {activity.posts === 0 ? (
          <>
            <p className="pa-note">כתבו הודעה ראשונה בקהילה.</p>
            <button type="button" className="community-publish" onClick={onWrite}>לקהילה</button>
          </>
        ) : (
          <>
            <p className="pa-note">המקום לפי הודעות בקהילה</p>
            <div className="pa-stats">
              <div>המקום שלכם<b>{mineRow?.place || '—'}</b></div>
              <div>הודעות<b>{activity.posts}</b></div>
            </div>
          </>
        )}
      </section>
      <div className="pa-hall-board">
        <section className="pa-card">
          <div className="pa-tabs">
            {([['all', 'כל הזמנים'], ['month', 'חודשי'], ['week', 'שבועי']] as const).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={range === id} onClick={() => setRange(id)}>{label}</button>
            ))}
          </div>
          <ol className="pa-board">
            {ranked.map((row) => (
              <li key={row.name}>
                <b>{row.place}</b>
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
  const host = window.location.hostname;
  const origin = host === 'localhost' || host === '127.0.0.1' ? 'https://infinite-masterpiece-weld.vercel.app' : window.location.origin;
  const link = `${origin}/library?ref=${userId.slice(0, 8)}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="pa-partners">
      <section className="pa-card">
        <p>אחרי שהחבר נרשם דרך הקישור, ההזמנה תיספר כאן. הספירה עצמה עוד לא פתוחה.</p>
        <p className="pa-link">{link}</p>
        <button type="button" className="community-publish" onClick={() => { void navigator.clipboard.writeText(link).then(() => setCopied(true)); }}>
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
        <a href={DEFAULT_WEBINAR_CONFIG.whatsappGroupUrl} target="_blank" rel="noreferrer"><b>הצטרפות לקבוצת הוואטסאפ</b><span>נפתחת קבוצת הקהילה, לא שיחה פרטית</span></a>
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
        <p className="pa-note">השליחה נפתחת באפליקציית המייל.</p>
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
      <section className="pa-card">
        <p className="pa-note">המסלול הפעיל</p>
        <h2>{labels[plan] || plan}</h2>
        <p>{active ? 'כלול: ספרייה, קהילה ומפגשי הפוד לפי המסלול.' : 'בחירת מסלול פותחת את הספרייה ואת הקהילה.'}</p>
        {plan === 'free_trial' && trialEndsAt ? <p>חידוש או סיום ב־{trialEndsAt}</p> : null}
        <Link to="/pricing" className="community-publish">ניהול המנוי</Link>
      </section>
    </div>
  );
}
