import { useEffect, useId, useState, type FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { podsApi } from '../api/pods';
import { communityApi, type CommunityHome, type CommunityPost } from '../api/community';
import { uploadFile } from '../api/upload';
import { useApp } from '../context/AppContext';
import {
  AREAS,
  AgentGrid,
  ClubCard,
  ContactDesk,
  CourseShelf,
  EventList,
  HallOfFame,
  HomeDesk,
  MonthBoard,
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
  return `לפני ${Math.round(hours / 24)} ימים`;
}

function Badge({ value }: { value: string }) {
  return <span className="community-tag" data-badge={value}>{value}</span>;
}

export function CommunityView() {
  const { setView, user, courses, myList, learningPaths, instructors, getContinueWatchingList, getWatchHistory } = useApp();
  const navigate = useNavigate();
  const composerId = useId();
  const [channel, setChannel] = useState('talk');
  const [home, setHome] = useState<CommunityHome | null>(null);
  const [body, setBody] = useState('');
  const [lecture, setLecture] = useState('');
  const [showLecture, setShowLecture] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [area, setArea] = useState<AreaId>('home');
  const [showPod, setShowPod] = useState(false);
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
    let cancelled = false;
    podsApi.me().then((state) => {
      if (!cancelled) setShowPod(state.showNav);
    }).catch(() => {
      if (!cancelled) setShowPod(false);
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
      await communityApi.post({ channel, body, lectureTitle: lecture, imageUrl });
      setBody('');
      setLecture('');
      setImageUrl('');
      setShowLecture(false);
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
  const current = home?.channels.find((item) => item.id === channel);
  const initial = home?.me?.initial || user.name.trim().charAt(0) || 'ח';

  const closeRail = () => setMenuOpen(false);

  return (
    <div className={`community-page${menuOpen ? ' is-rail-open' : ''}`}>
      <button type="button" className="community-rail-toggle" aria-expanded={menuOpen} aria-controls="community-rail" onClick={() => setMenuOpen((value) => !value)}>
        תפריט
      </button>
      <aside id="community-rail" className="community-rail" aria-label="ניווט האזור האישי">
        <button type="button" className="community-brand" onClick={() => setView('home')}>
          <span className="community-mark" aria-hidden="true">∞</span>
          <span>Infinite Masterpiece</span>
        </button>
        <nav className="community-nav" aria-label="האזור האישי">
          {AREAS.map((item) => (
            <span key={item.id} className="community-nav-slot">
              <button type="button" aria-current={area === item.id ? 'page' : undefined} onClick={() => { setArea(item.id); closeRail(); }}>
                {item.label}
              </button>
              {item.id === 'calendar' && showPod ? (
                <button type="button" onClick={() => { closeRail(); navigate('/pod'); }}>הפוד שלי</button>
              ) : null}
            </span>
          ))}
          <button type="button" onClick={() => { closeRail(); setView('profile'); }}>חשבון</button>
        </nav>
        {area === 'feed' && home && open ? (
          <div className="community-channels" aria-label="ערוצים">
            <h2>ערוצים</h2>
            {home.channels.map((item) => (
              <button
                key={item.id}
                type="button"
                className="community-channel"
                aria-current={item.id === channel ? 'page' : undefined}
                onClick={() => { setChannel(item.id); closeRail(); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        <button type="button" className="community-account" onClick={() => { closeRail(); setView('profile'); }}>
          <span className="community-initial" aria-hidden="true">{initial}</span>
          <span>{home?.me?.firstName || user.name.split(' ')[0] || 'חשבון'}</span>
        </button>
      </aside>
      {menuOpen ? <button type="button" className="community-scrim" aria-label="סגירת התפריט" onClick={closeRail} /> : null}

      <main className="community-main" id="community-main">
        <p className="community-kicker">האזור האישי</p>
        <h1>{AREAS.find((item) => item.id === area)?.label || 'הבית'}</h1>
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
            continueItem={getContinueWatchingList()[0] || null}
            onOpenFeed={() => setArea('feed')}
            onOpenCourse={(courseId) => courseId && setView('course', { courseId })}
            onOpenView={(view) => setView(view)}
            onOpenInstructor={(instructorId) => setView('instructor', { instructorId })}
            onWatch={(courseId, episodeId) => setView('watch', { courseId, episodeId })}
          />
        ) : null}
        {area === 'calendar' ? <MonthBoard /> : null}
        {area === 'recordings' ? <EventList courses={lessons} onOpen={(courseId) => setView('course', { courseId })} /> : null}
        {area === 'courses' ? <CourseShelf title="קורסים ושיעורים" courses={lessons} onOpen={(courseId) => setView('course', { courseId })} /> : null}
        {area === 'shorts' ? <CourseShelf title="הדרכות קצרות" courses={shorts} onOpen={(courseId) => setView('course', { courseId })} /> : null}
        {area === 'club' ? <ClubCard plan={user.subscriptionPlan} /> : null}
        {area === 'agents' ? <AgentGrid /> : null}
        {area === 'hall' && home ? <HallOfFame user={user} posts={home.posts} /> : null}
        {area === 'partners' ? <Partners userId={user.id} /> : null}
        {area === 'contact' ? <ContactDesk /> : null}

        {area === 'feed' && home && open ? (
          <div className="community-layout">
            <section className="community-feed" aria-label="פיד">
              {current?.canPost ? (
                <form className="community-card community-composer" onSubmit={(event) => { event.preventDefault(); void publish(); }}>
                  <label className="community-sr" htmlFor={composerId}>מה תרצו לשתף</label>
                  <div className="community-compose-row">
                    <div className="community-initial" aria-hidden="true">{initial}</div>
                    <textarea id={composerId} value={body} onChange={(event) => setBody(event.target.value)} placeholder="מה תרצו לשתף?" />
                  </div>
                  {showLecture ? (
                    <label className="community-lecture">
                      <span className="community-sr">שם ההרצאה</span>
                      <input value={lecture} onChange={(event) => setLecture(event.target.value)} placeholder="שם ההרצאה" />
                    </label>
                  ) : null}
                  {imageUrl ? <img className="community-photo" src={imageUrl} alt="" /> : null}
                  <div className="community-actions">
                    <div className="community-tools">
                      <label className="community-file">
                        תמונה
                        <input className="community-sr" type="file" accept="image/*" onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (!file) return;
                          void uploadFile(file, 'image').then(setImageUrl).catch((err: unknown) => {
                            setError(err instanceof Error ? err.message : 'העלאה נכשלה');
                          });
                        }} />
                      </label>
                      <button type="button" aria-pressed={showLecture} onClick={() => setShowLecture((value) => !value)}>קישור להרצאה</button>
                    </div>
                    <button type="submit" className="community-publish" disabled={pending}>{pending ? 'מפרסם…' : 'פרסום'}</button>
                  </div>
                </form>
              ) : null}

              {home.posts.length === 0 ? <p className="community-empty">עדיין אין כאן פוסטים. הראשון פותח את השיחה.</p> : null}
              {home.me?.muted ? <p className="community-note">הפרסום הושתק על ידי הצוות.</p> : null}
              {home.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isAdmin={Boolean(home.me?.isAdmin)}
                  open={Boolean(openReplies[post.id])}
                  draft={replyDraft[post.id] || ''}
                  onToggle={() => setOpenReplies((current) => ({ ...current, [post.id]: !current[post.id] }))}
                  onDraft={(value) => setReplyDraft((current) => ({ ...current, [post.id]: value }))}
                  onAct={act}
                />
              ))}
              {home.nextCursor ? (
                <button type="button" className="community-publish" disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore ? 'טוען…' : 'עוד פוסטים'}
                </button>
              ) : null}
            </section>

            <aside className="community-card community-side">
              <div>
                <h2>כללי הקהילה</h2>
                <p className="community-rule">מדברים בכבוד, גם כשחולקים.</p>
                <p className="community-rule">בלי פרסום ובלי מכירה בפיד.</p>
                <p className="community-rule">דיווח מגיע לצוות. פוסט מוסתר נשאר ביומן.</p>
              </div>
              <div>
                <h2>כאן עכשיו</h2>
                {home.people.map((person) => (
                  <div className="community-person" key={`${person.firstName}-${person.badge}`}>
                    <div className="community-initial" aria-hidden="true">{person.initial}</div>
                    <span>{person.firstName}</span>
                    <Badge value={person.badge} />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}


const PostCard: FC<{
  post: CommunityPost;
  isAdmin: boolean;
  open: boolean;
  draft: string;
  onToggle: () => void;
  onDraft: (value: string) => void;
  onAct: (work: () => Promise<unknown>) => Promise<void>;
}> = ({
  post,
  isAdmin,
  open,
  draft,
  onToggle,
  onDraft,
  onAct,
}) => {
  const replyId = useId();
  const editId = useId();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  return (
    <article className="community-card community-post">
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
      {post.lectureTitle ? <div className="community-lecture-chip">הרצאה · {post.lectureTitle}</div> : null}
      <div className="community-tools">
        {post.canEdit ? <button type="button" onClick={() => { setEditBody(post.body); setEditing(true); }}>עריכה</button> : null}
        <button type="button" aria-pressed={post.hearted} onClick={() => void onAct(() => communityApi.react(post.id))}>♡ {post.hearts}</button>
        <button type="button" aria-expanded={open} onClick={onToggle}>תגובות {post.replies.length}</button>
        <button type="button" aria-pressed={post.saved} onClick={() => void onAct(() => communityApi.bookmark(post.id))}>{post.saved ? 'שמור' : 'שמירה'}</button>
        <button type="button" aria-pressed={post.reported} onClick={() => void onAct(() => communityApi.report(post.id))}>{post.reported ? 'דווח' : 'דיווח'}</button>
        {isAdmin ? (
          <>
            <button type="button" onClick={() => void onAct(() => communityApi.pin(post.id, !post.pinned))}>{post.pinned ? 'שחרור' : 'נעיצה'}</button>
            <button type="button" onClick={() => void onAct(() => communityApi.hide(post.id, !post.hidden))}>{post.hidden ? 'החזרה' : 'הסתרה'}</button>
          </>
        ) : null}
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
            <textarea id={replyId} value={draft} onChange={(event) => onDraft(event.target.value)} placeholder="תגובה" />
            <button type="submit" className="community-publish">שליחה</button>
          </form>
        </div>
      ) : null}
    </article>
  );
};
