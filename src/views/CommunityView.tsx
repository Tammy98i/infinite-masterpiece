import { useEffect, useId, useState, type FC } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { podsApi } from '../api/pods';
import { communityApi, type CommunityHome, type CommunityPost } from '../api/community';
import { uploadFile } from '../api/upload';
import { useApp } from '../context/AppContext';
import { useMyListToggle } from '../utils/useMyListToggle';
import {
  AREAS,
  AREA_NOTES,
  AgentGrid,
  type ClubSession,
  AreaTop,
  ClubCard,
  ContactDesk,
  CourseShelf,
  EventList,
  HallOfFame,
  HomeDesk,
  MonthBoard,
  PodEntry,
  type AssignedPod,
  Partners,
  type AreaId,
} from './personal/PersonalSections';
import '../styles/Community.css';

function relativeTime(value: string) {
  const then = new Date(`${value.replace(' ', 'T')}Z`).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.round(hours / 24);
  if (days <= 1) return 'אתמול';
  return `לפני ${days} ימים`;
}

function replyLabel(count: number) {
  if (count <= 0) return 'הוספת תגובה';
  if (count === 1) return 'תגובה אחת';
  return `${count} תגובות`;
}

function clockLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function parseClock(value: string) {
  const match = value.trim().match(/^(\d{1,3}):(\d{2})$/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function areaFromPath(pathname: string): 'feed' | 'home' | null {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts[0] !== 'library' || parts[1] !== 'community') return null;
  if (parts[2] === 'home') return 'home';
  if (!parts[2] || parts[2] === 'feed') return 'feed';
  return null;
}

const SIDE_NAV: Array<{ id: AreaId; label: string }> = [
  { id: 'home', label: 'ראשי' },
  { id: 'courses', label: 'הקורסים שלי' },
  { id: 'calendar', label: 'אירועים ומפגשים' },
  { id: 'recordings', label: 'הקלטות' },
  { id: 'shorts', label: 'הדרכות' },
  { id: 'agents', label: 'סוכני AI' },
  { id: 'feed', label: 'הקהילה' },
  { id: 'hall', label: 'היכל התהילה' },
  { id: 'partners', label: 'תוכנית שותפים' },
  { id: 'contact', label: 'צור קשר' },
];

function railLabel(id: AreaId) {
  return SIDE_NAV.find((item) => item.id === id)?.label || AREAS.find((item) => item.id === id)?.label || '';
}

function Badge({ value }: { value: string }) {
  return <span className="community-tag" data-badge={value}>{value}</span>;
}

export function CommunityView() {
  const { setView, logout, user, courses, categories, myList, learningPaths, instructors, getContinueWatchingList, getWatchHistory, getMyLectures, getRecommendedForUser } = useApp();
  const toggleSaved = useMyListToggle();
  const navigate = useNavigate();
  const location = useLocation();
  const composerId = useId();
  const [channel, setChannel] = useState('all');
  const [home, setHome] = useState<CommunityHome | null>(null);
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [area, setAreaState] = useState<AreaId>(() => areaFromPath(window.location.pathname) || 'home');
  const [composeOpen, setComposeOpen] = useState(false);
  const [lectureId, setLectureId] = useState('');
  const [lectureAt, setLectureAt] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [areaQuery, setAreaQuery] = useState('');
  const [assignedPod, setAssignedPod] = useState<AssignedPod | null>(null);
  const [podSession, setPodSession] = useState<ClubSession | null>(null);
  const shorts = courses.filter((course) => course.isShort);
  const lessons = courses.filter((course) => !course.isShort);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [loadingMore, setLoadingMore] = useState(false);

  const load = (next = channel) => {
    setError('');
    return communityApi.home(next).then((data) => {
      setHome(data);
      if (data.access === 'open' && data.channel !== next) setChannel(data.channel);
      return data;
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'לא הצלחנו לטעון את הקהילה');
    });
  };

  const loadMore = async () => {
    if (!home?.nextCursor) return;
    setLoadingMore(true);
    setError('');
    try {
      const data = await communityApi.home(channel, home.nextCursor);
      setHome((current) => current && current.access === 'open' && data.access === 'open'
        ? {
            ...current,
            nextCursor: data.nextCursor,
            posts: [...current.posts, ...data.posts.filter((post) => !current.posts.some((item) => item.id === post.id))],
          }
        : data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'לא הצלחנו לטעון עוד');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (home?.access === 'locked') setView('profile');
  }, [home, setView]);

  useEffect(() => {
    const next = areaFromPath(location.pathname);
    if (next === 'feed') setAreaState('feed');
    if (next === 'home') setAreaState((current) => (current === 'feed' ? 'home' : current));
  }, [location.pathname]);

  const setArea = (next: AreaId) => {
    setAreaState(next);
    const current = location.pathname.replace(/\/+$/, '');
    if (next === 'feed' && current !== '/library/community') navigate('/library/community');
    if (next === 'home' && current !== '/library/community/home') navigate('/library/community/home');
    if (next !== 'feed' && next !== 'home' && (current === '/library/community' || current.endsWith('/community/feed'))) navigate('/library/community/home');
  };

  useEffect(() => {
    let cancelled = false;
    podsApi.me().then((state) => {
      if (cancelled) return;
      const pod = state.pods[0];
      setAssignedPod(pod ? { name: pod.name, week: pod.currentWeek, role: pod.myRole === 'captain' ? 'captain' : 'member' } : null);
      setPodSession(pod?.session?.startsAt ? { startsAt: pod.session.startsAt, title: pod.name, notes: pod.session.notes || '' } : null);
    }).catch(() => {
      if (!cancelled) {
        setAssignedPod(null);
        setPodSession(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => {
    let cancelled = false;
    communityApi.home(channel).then((data) => {
      if (cancelled) return;
      setHome(data);
      if (data.access === 'open' && data.channel !== channel) setChannel(data.channel);
    }).catch((err: unknown) => {
      if (!cancelled) setError(err instanceof Error ? err.message : 'לא הצלחנו לטעון את הקהילה');
    });
    return () => {
      cancelled = true;
    };
  }, [channel]);

  const refresh = () => load(channel);

  const publish = async () => {
    setPending(true);
    setError('');
    try {
      const picked = courses.find((course) => course.id === lectureId);
      await communityApi.post({
        channel: channel === 'all' ? 'talk' : channel,
        body,
        lectureTitle: picked?.title || '',
        imageUrl,
        lectureSeconds: picked ? parseClock(lectureAt) : 0,
      });
      setBody('');
      setLectureId('');
      setLectureAt('');
      setImageUrl('');
      setComposeOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הפרסום נכשל');
    } finally {
      setPending(false);
    }
  };

  const act = async (work: () => Promise<unknown>) => {
    setError('');
    try {
      await work();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הפעולה נכשלה');
    }
  };

  const open = home?.access === 'open';
  const current = channel === 'all'
    ? { id: 'all', label: 'הכל', canPost: Boolean(home?.channels.find((item) => item.id === 'talk')?.canPost) }
    : home?.channels.find((item) => item.id === channel);
  const initial = home?.me?.initial || user.name.trim().charAt(0) || 'ח';

  const closeRail = () => setMenuOpen(false);
  const term = areaQuery.trim();
  const lessonHits = term && area !== 'courses' && area !== 'shorts' ? courses.filter((course) => course.title.includes(term)).slice(0, 5) : [];
  const peopleHits = term && area !== 'courses' && area !== 'shorts' ? instructors.filter((person) => person.name.includes(term) && person.showInLibrary !== false).slice(0, 4) : [];
  const postHits = term && area !== 'courses' && area !== 'shorts' && home?.access === 'open' ? home.posts.filter((post) => `${post.body} ${post.author.firstName}`.includes(term)).slice(0, 4) : [];

  return (
    <div className={`community-page${menuOpen ? ' is-rail-open' : ''}`}>
      <button type="button" className="community-rail-toggle" aria-expanded={menuOpen} aria-controls="community-rail" onClick={() => setMenuOpen((value) => !value)}>
        תפריט
      </button>
      <aside id="community-rail" className="community-rail" aria-label="ניווט האזור האישי">
        <button type="button" className="community-brand" onClick={() => { setArea('home'); closeRail(); }}>
          <span className="community-mark" aria-hidden="true">∞</span>
          <span className="community-word">Infinite<br />Masterpiece</span>
        </button>
        <nav className="community-nav" aria-label="האזור האישי">
          {SIDE_NAV.map((item) => (
            <button key={item.id} type="button" aria-current={area === item.id ? 'page' : undefined} onClick={() => { setArea(item.id); closeRail(); }}>
              {item.label}
            </button>
          ))}
          {assignedPod ? <button type="button" onClick={() => { closeRail(); navigate('/pod'); }}>הפוד שלי</button> : null}
        </nav>
        <div className="pa-member">
          {user.avatar && !user.avatar.includes('images.unsplash.com') ? <img src={user.avatar} alt="" /> : <span className="community-initial" aria-hidden="true">{initial}</span>}
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>
        <div className="community-nav community-nav-foot">
          <button type="button" onClick={() => { closeRail(); navigate('/library/profile#profile-name'); }}>הגדרות</button>
          <button type="button" onClick={() => { closeRail(); navigate('/library/profile#profile-interests'); }}>תחומי עניין</button>
          <button type="button" onClick={() => { closeRail(); logout(); }}>יציאה</button>
        </div>
        <button type="button" className="pa-reward" onClick={() => { setArea('club'); closeRail(); }}>
          <span>המסלול שלך</span>
          <strong>{user.subscriptionPlan === 'premium_88' ? 'נבחרת 88' : user.subscriptionPlan === 'annual' ? 'מנוי שנתי' : user.subscriptionPlan === 'monthly' ? 'מנוי חודשי' : 'חבר'}</strong>
          <em>למועדון</em>
        </button>
        {area === 'feed' && home && open ? (
          <div className="community-channels" aria-label="הקהילה">
            <h2>הכל</h2>
          </div>
        ) : null}
      </aside>
      {menuOpen ? <button type="button" className="community-scrim" aria-label="סגירת התפריט" onClick={closeRail} /> : null}
      <nav className="community-dock" aria-label="ניווט מהיר">
        <button type="button" aria-current={area === 'home' ? 'page' : undefined} onClick={() => setArea('home')}>הבית שלי</button>
        <button type="button" aria-current={area === 'courses' ? 'page' : undefined} onClick={() => setArea('courses')}>הלמידה שלי</button>
        <button type="button" aria-current={area === 'feed' ? 'page' : undefined} onClick={() => setArea('feed')}>קהילה</button>
        <button type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>עוד</button>
      </nav>

      <main className="community-main" id="community-main">
        <AreaTop initial={initial} name={user.name || 'חשבון'} avatar={user.avatar && !user.avatar.includes('images.unsplash.com') ? user.avatar : ''} query={areaQuery} onQuery={setAreaQuery} onBoard={() => setArea('feed')} onProfile={() => navigate('/library/profile#profile-name')} />
        {term && area !== 'courses' && area !== 'shorts' ? (
          <div className="community-card pa-search-hits">
            {lessonHits.map((course) => (
              <button key={course.id} type="button" className="pa-linkrow" onClick={() => setView('course', { courseId: course.id })}>{course.title}</button>
            ))}
            {peopleHits.map((person) => (
              <button key={person.id} type="button" className="pa-linkrow" onClick={() => setView('instructor', { instructorId: person.id })}>{person.name}</button>
            ))}
            {postHits.map((post) => (
              <button key={post.id} type="button" className="pa-linkrow" onClick={() => setArea('feed')}>{post.author.firstName}: {post.body}</button>
            ))}
            {lessonHits.length + peopleHits.length + postHits.length === 0 ? <p className="pa-note">אין תוצאות עבור «{term}».</p> : null}
          </div>
        ) : null}
        {area !== 'home' ? <h1>{area === 'courses' ? 'הלמידה שלי' : railLabel(area) || 'ראשי'}</h1> : null}
        {area !== 'home' && area !== 'feed' ? <p className="community-lede">{AREA_NOTES[area]}</p> : null}
        {error ? <p className="community-error" role="alert">{error}</p> : null}

        {!home ? <p className="community-note">טוענים את הקהילה…</p> : null}

        {home && !open ? (
          <section className="community-card community-door">
            <h2>הקהילה נפתחת למנוי משלם</h2>
            <p>בחירת מסלול פותחת את השיחה, התגובות והשמירה.</p>
            <Link to="/library-membership" className="community-publish" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>פתיחת גישה</Link>
          </section>
        ) : null}

        {area === 'home' && open && home ? (
          <HomeDesk
            user={user}
            posts={home.posts}
            shorts={shorts.slice(0, 8)}
            saved={courses.filter((course) => myList.includes(course.id))}
            history={getWatchHistory()}
            paths={learningPaths}
            instructors={instructors.filter((instructor) => instructor.showInLibrary !== false).slice(0, 8)}
            mine={getMyLectures()}
            recommended={getRecommendedForUser().slice(0, 8)}
            newest={[...lessons].filter((course) => !course.status || course.status === 'published').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 8)}
            categories={categories}
            founders={instructors.filter((instructor) => instructor.isFounder && instructor.showInLibrary !== false)}
            continueItem={getContinueWatchingList()[0] || null}
            session={podSession}
            pod={assignedPod}
            watches={getWatchHistory().length}
            onOpenFeed={() => setArea('feed')}
            onOpenHall={() => setArea('hall')}
            onOpenCourse={(courseId) => courseId && setView('course', { courseId })}
            onOpenCourses={() => setArea('courses')}
            onOpenCategory={(categoryId) => setView('category', { categoryId })}
            onOpenShorts={() => setArea('shorts')}
            onOpenView={(view) => setView(view)}
            onOpenInstructor={(instructorId) => setView('instructor', { instructorId })}
            onOpenProfile={(field) => navigate(`/library/profile#${field}`)}
            onOpenCalendar={() => setArea('calendar')}
            onOpenSession={() => navigate('/pod')}
            onWatch={(courseId, episodeId) => setView('watch', { courseId, episodeId })}
            savedIds={myList}
            onToggleSave={toggleSaved}
            onPublish={async (input) => {
              await communityApi.post({ channel: channel === 'all' ? 'talk' : channel, body: input.body, lectureTitle: input.lectureTitle, imageUrl: input.imageUrl });
              await refresh();
            }}
            onReact={async (postId) => {
              await communityApi.react(postId);
              await refresh();
            }}
            onReply={async (postId, text) => {
              await communityApi.reply(postId, text);
              await refresh();
            }}
          />
        ) : null}
        {area === 'calendar' ? (
          <div className="pa-calendar-layout">
            <MonthBoard sessions={podSession ? [podSession] : []} />
            {assignedPod ? <PodEntry pod={assignedPod} onOpen={() => navigate('/pod')} /> : null}
          </div>
        ) : null}
        {area === 'recordings' ? (
          <EventList
            sessions={podSession ? [podSession] : []}
            onOpenSession={() => navigate('/pod')}
            onOpenCalendar={() => setArea('calendar')}
            suggestion={lessons[0] ? { title: lessons[0].title, onOpen: () => setView('course', { courseId: lessons[0].id }) } : null}
          />
        ) : null}
        {area === 'courses' ? (
          <div className="pa-learning">
            <section className="pa-card">
              <h2>בתהליך</h2>
              {getContinueWatchingList()[0] ? (
                <button type="button" className="pa-linkrow" onClick={() => {
                  const item = getContinueWatchingList()[0];
                  if (item) setView('watch', { courseId: item.course.id, episodeId: item.episode.id });
                }}>
                  <strong>{getContinueWatchingList()[0]?.course.title}</strong>
                  <span>המשך צפייה</span>
                </button>
              ) : <p className="pa-note">עוד אין שיעור באמצע. ההרצאה הראשונה תחכה כאן.</p>}
            </section>
            <section className="pa-card">
              <h2>שמרתי להמשך</h2>
              {courses.filter((course) => myList.includes(course.id)).slice(0, 4).map((course) => (
                <button key={course.id} type="button" className="pa-linkrow" onClick={() => setView('course', { courseId: course.id })}>{course.title}</button>
              ))}
              {myList.length === 0 ? <p className="pa-note">עוד לא שמרתם הרצאה.</p> : null}
            </section>
            <CourseShelf title="כל ההרצאות הפתוחות" noun="הרצאה" courses={lessons} categories={categories} query={areaQuery} onQuery={setAreaQuery} onOpen={(courseId) => setView('course', { courseId })} />
          </div>
        ) : null}
        {area === 'shorts' ? <CourseShelf title="הדרכות" noun="הדרכה" courses={shorts} video showFilters={false} onOpen={(courseId) => setView('course', { courseId })} /> : null}
        {area === 'club' ? <ClubCard plan={user.subscriptionPlan} trialEndsAt={user.trialEndsAt} /> : null}
        {area === 'agents' ? <AgentGrid onContact={() => setArea('contact')} /> : null}
        {area === 'hall' && home ? <HallOfFame user={user} posts={home.posts} watches={getWatchHistory().length} onWrite={() => setArea('feed')} /> : null}
        {area === 'partners' ? <Partners userId={user.id} /> : null}
        {area === 'contact' ? <ContactDesk /> : null}

        {area === 'feed' && home && open ? (
            <section className="community-feed" aria-label="פיד">
              {current?.canPost && !composeOpen ? (
                <button type="button" className="community-prompt" onClick={() => setComposeOpen(true)}>יש לך שאלה או תובנה לשתף?</button>
              ) : null}
              {current?.canPost && composeOpen ? (
                <form className="community-card community-composer" onSubmit={(event) => { event.preventDefault(); if (body.trim().length >= 2) void publish(); }}>
                  <label className="community-sr" htmlFor={composerId}>מה תרצו לשתף</label>
                  <textarea id={composerId} value={body} onChange={(event) => setBody(event.target.value)} placeholder="יש לך שאלה או תובנה לשתף?" />
                  {imageUrl ? <img className="community-photo" src={imageUrl} alt="" /> : null}
                  <div className="community-attach">
                    <label className="community-file">
                      צירוף תמונה
                      <input className="community-sr" type="file" accept="image/*" onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (!file) return;
                        void uploadFile(file, 'image').then(setImageUrl).catch((err: unknown) => {
                          setError(err instanceof Error ? err.message : 'העלאה נכשלה');
                        });
                      }} />
                    </label>
                    <label>
                      צירוף הרצאה
                      <select value={lectureId} onChange={(event) => setLectureId(event.target.value)}>
                        <option value="">בחרו הרצאה</option>
                        {lessons.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                      </select>
                    </label>
                    {lectureId ? (
                      <label>
                        זמן בדוגמה
                        <input value={lectureAt} onChange={(event) => setLectureAt(event.target.value)} placeholder="04:00" inputMode="numeric" aria-label="זמן בדוגמה" />
                      </label>
                    ) : null}
                  </div>
                  <div className="community-actions">
                    <button type="button" onClick={() => setComposeOpen(false)}>סגירה</button>
                    <button type="submit" className="community-publish" disabled={pending || body.trim().length < 2}>{pending ? 'שולח…' : 'פרסום בקהילה'}</button>
                  </div>
                </form>
              ) : null}

              {home.me?.muted ? <p className="community-note">הפרסום הושתק על ידי הצוות.</p> : null}
              {(savedOnly ? [] : home.posts.filter((post) => post.pinned)).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  week
                  isAdmin={Boolean(home.me?.isAdmin)}
                  open={Boolean(openReplies[post.id])}
                  draft={replyDraft[post.id] || ''}
                  onToggle={() => setOpenReplies((current) => ({ ...current, [post.id]: !current[post.id] }))}
                  onDraft={(value) => setReplyDraft((current) => ({ ...current, [post.id]: value }))}
                  onAct={act}
                  onExample={(seconds) => {
                    const course = lessons.find((item) => item.title === post.lectureTitle) || lessons.find((item) => post.lectureTitle && (item.title.includes(post.lectureTitle) || post.lectureTitle.includes(item.title)));
                    const episode = course?.episodes[0];
                    if (course && episode) navigate(`/library/watch/${encodeURIComponent(course.id)}/${encodeURIComponent(episode.id)}?t=${seconds}`);
                  }}
                />
              ))}
              <div className="pa-rowhead">
                <h2>{savedOnly ? 'השמורים שלי' : 'פוסטים אחרונים'}</h2>
                <button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly((value) => !value)}>{savedOnly ? 'לכל הפוסטים' : 'השמורים שלי'}</button>
              </div>
              {(savedOnly ? home.posts.filter((post) => post.saved) : home.posts.filter((post) => !post.pinned)).length === 0 ? (
                <p className="community-empty">{savedOnly ? 'עוד לא שמרתם פוסט.' : 'עדיין אין הודעות. הראשונה פותחת את השיחה.'}</p>
              ) : null}
              {(savedOnly ? home.posts.filter((post) => post.saved) : home.posts.filter((post) => !post.pinned)).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isAdmin={Boolean(home.me?.isAdmin)}
                  open={Boolean(openReplies[post.id])}
                  draft={replyDraft[post.id] || ''}
                  onToggle={() => setOpenReplies((current) => ({ ...current, [post.id]: !current[post.id] }))}
                  onDraft={(value) => setReplyDraft((current) => ({ ...current, [post.id]: value }))}
                  onAct={act}
                  onExample={(seconds) => {
                    const course = lessons.find((item) => item.title === post.lectureTitle) || lessons.find((item) => post.lectureTitle && (item.title.includes(post.lectureTitle) || post.lectureTitle.includes(item.title)));
                    const episode = course?.episodes[0];
                    if (course && episode) navigate(`/library/watch/${encodeURIComponent(course.id)}/${encodeURIComponent(episode.id)}?t=${seconds}`);
                  }}
                />
              ))}
              {home.nextCursor ? (
                <button type="button" className="community-publish" disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore ? 'טוען…' : 'עוד פוסטים'}
                </button>
              ) : null}
            </section>
        ) : null}
      </main>
    </div>
  );
}


const PostCard: FC<{
  post: CommunityPost;
  week?: boolean;
  isAdmin: boolean;
  open: boolean;
  draft: string;
  onToggle: () => void;
  onDraft: (value: string) => void;
  onAct: (work: () => Promise<unknown>) => Promise<void>;
  onExample: (seconds: number) => void;
}> = ({
  post,
  week = false,
  isAdmin,
  open,
  draft,
  onToggle,
  onDraft,
  onAct,
  onExample,
}) => {
  const replyId = useId();
  const editId = useId();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  return (
    <article className={`community-card community-post${week ? ' is-week' : ''}`}>
      {week ? <p className="community-kicker">דיון השבוע · {post.author.firstName}{post.author.badge ? ` · ${post.author.badge}` : ''}</p> : null}
      <div className="community-post-head">
        <div className="community-initial" aria-hidden="true">{post.author.initial}</div>
        <div>
          <div className="community-name">{post.author.firstName}</div>
          <div className="community-meta">
            <Badge value={post.author.badge} />
            <span>{relativeTime(post.createdAt)}</span>
            {post.pinned ? <span>נעוץ</span> : null}
          </div>
        </div>
      </div>
      {post.hidden ? <p className="community-hidden">הוסתר על ידי הצוות</p> : null}
      {editing ? (
        <form onSubmit={(event) => {
          event.preventDefault();
          void onAct(async () => {
            await communityApi.edit(post.id, editBody);
            setEditing(false);
          });
        }}>
          <label className="community-sr" htmlFor={editId}>עריכת הפוסט</label>
          <textarea id={editId} value={editBody} onChange={(event) => setEditBody(event.target.value)} />
          <div className="community-tools">
            <button type="submit" className="community-publish">שמירה</button>
            <button type="button" onClick={() => setEditing(false)}>ביטול</button>
          </div>
        </form>
      ) : <p>{post.body}</p>}
      {post.imageUrl ? <img className="community-photo" src={post.imageUrl} alt="" /> : null}
      {post.lectureTitle && post.lectureSeconds ? (
        <button type="button" className="community-example" onClick={() => onExample(post.lectureSeconds || 0)}>
          {week ? `לצפייה בדוגמה · ${clockLabel(post.lectureSeconds)}` : `${post.lectureTitle} · ${clockLabel(post.lectureSeconds)}`}
        </button>
      ) : post.lectureTitle ? <div className="community-lecture-chip">הרצאה · {post.lectureTitle}</div> : null}
      <div className="community-tools">
        {post.canEdit ? <button type="button" className="is-quiet" onClick={() => { setEditBody(post.body); setEditing(true); }}>עריכה</button> : null}
        <button type="button" className="community-reply-cta" aria-expanded={open} onClick={onToggle}>{replyLabel(post.replies.length)}</button>
        <button type="button" className="is-quiet" aria-pressed={post.hearted} onClick={() => void onAct(() => communityApi.react(post.id))}>אהבתי {post.hearts}</button>
        <button type="button" className="is-quiet" aria-pressed={post.saved} onClick={() => void onAct(() => communityApi.bookmark(post.id))}>{post.saved ? 'נשמר' : 'שמירה'}</button>
        <details className="community-more">
          <summary>עוד</summary>
          <button type="button" aria-pressed={post.reported} onClick={() => !post.reported && void onAct(() => communityApi.report(post.id))}>{post.reported ? 'דווח' : 'דיווח'}</button>
          {isAdmin ? (
            <>
              <button type="button" onClick={() => void onAct(() => communityApi.pin(post.id, !post.pinned))}>{post.pinned ? 'שחרור' : 'נעיצה'}</button>
              <button type="button" onClick={() => void onAct(() => communityApi.hide(post.id, !post.hidden))}>{post.hidden ? 'החזרה' : 'הסתרה'}</button>
            </>
          ) : null}
        </details>
      </div>
      {open ? (
        <div className="community-replies">
          {post.replies.map((reply) => (
            <div className="community-reply" key={reply.id}>
              <strong className="community-name">{reply.author.firstName}</strong> <Badge value={reply.author.badge} />
              <p>{reply.body}</p>
            </div>
          ))}
          <form onSubmit={(event) => {
            event.preventDefault();
            void onAct(async () => {
              await communityApi.reply(post.id, draft);
              onDraft('');
            });
          }}>
            <label className="community-sr" htmlFor={replyId}>תגובה</label>
            <textarea id={replyId} value={draft} onChange={(event) => onDraft(event.target.value)} placeholder="כתבו תגובה" />
            <button type="submit" className="community-publish">שליחת תגובה</button>
          </form>
        </div>
      ) : null}
    </article>
  );
};
