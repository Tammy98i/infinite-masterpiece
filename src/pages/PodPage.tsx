import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { podsApi, type MyPodsState, type PodHome } from '../api/pods';
import { useUser } from '../context/UserContext';
import { Bidi } from '../components/Bidi';
import { DirBack } from '../components/DirArrow';
import {
  POD_KIND_LABELS,
  POD_MEMBER_STATUS_LABELS,
  POD_STATUS_LABELS,
  POD_TASK_STATUS_LABELS,
  nameInitial,
} from '../lib/pods';

function formatWhen(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function StatusMark({ label, tone }: { label: string; tone: 'gold' | 'ok' | 'warn' | 'mute' }) {
  const mark = tone === 'ok' ? '●' : tone === 'warn' ? '▲' : tone === 'gold' ? '◆' : '○';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span aria-hidden className={tone === 'ok' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : tone === 'gold' ? 'text-[#dfc47d]' : 'text-white/40'}>
        {mark}
      </span>
      <span className="text-white/75">{label}</span>
    </span>
  );
}

function taskTone(status: string): 'gold' | 'ok' | 'warn' | 'mute' {
  if (status === 'reviewed') return 'ok';
  if (status === 'stuck') return 'warn';
  if (status === 'submitted') return 'gold';
  return 'mute';
}

export function PodPage() {
  const { user, isGuest, setAuthModalOpen } = useUser();
  const [state, setState] = useState<MyPodsState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [podId, setPodId] = useState<string>('');

  const load = () => {
    if (isGuest) {
      setLoading(false);
      setState(null);
      return;
    }
    setLoading(true);
    podsApi
      .me()
      .then((data) => {
        setState(data);
        setPodId((current) => current && data.pods.some((pod) => pod.id === current) ? current : data.pods[0]?.id || '');
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'לא ניתן לטעון את הפוד'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [isGuest, user.id]);

  const pod = useMemo(() => state?.pods.find((item) => item.id === podId) || state?.pods[0] || null, [state, podId]);

  if (isGuest) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-start" dir="rtl">
        <h1 className="text-3xl font-light text-white mb-4">הפוד שלי</h1>
        <p className="text-white/60 mb-6">הפוד שייך למשתתפי המסע ולחברי נבחרת 88 אחרי שיוך.</p>
        <button type="button" className="btn-gold min-h-11" onClick={() => setAuthModalOpen(true)}>
          התחברות
        </button>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24" dir="rtl">
        <p role="status" className="text-white/60">טוענים את הפוד…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24" dir="rtl">
        <p role="alert" className="text-[#dfc47d]">{error}</p>
      </section>
    );
  }

  if (!state?.eligible) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-start" dir="rtl">
        <h1 className="text-3xl font-light text-white mb-4">הפוד שלי</h1>
        <p className="text-white/60 leading-relaxed">
          הפוד הוא מסגרת ליווי של המסע, לא מנוי ספרייה. מי שנרשם למנוי צפייה בלבד לא נכנס לתור השיוך.
        </p>
      </section>
    );
  }

  if (!pod) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-start" dir="rtl">
        <h1 className="text-3xl font-light text-white mb-3">הפוד שלי</h1>
        <p className="text-white/70 text-lg">עדיין משייכים אותך לפוד. הקפטן ייצור קשר.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:pt-14 text-start" dir="rtl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white min-h-11">
        <DirBack className="h-4 w-4" />
        חזרה
      </Link>
      {state.pods.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="הפודים שלי">
          {state.pods.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === pod.id}
              onClick={() => setPodId(item.id)}
              className={`min-h-11 rounded-full px-4 text-sm ${item.id === pod.id ? 'bg-[#b79043] text-black' : 'border border-white/15 text-white'}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
      {state.pendingAssignment ? (
        <p role="status" className="mt-4 text-sm text-[#dfc47d]">
          עדיין משייכים אותך לפוד נוסף. הקפטן ייצור קשר.
        </p>
      ) : null}
      <MemberPod pod={pod} onChanged={load} />
      {pod.isCaptain && pod.captainView ? <CaptainDesk pod={pod} onChanged={load} /> : null}
    </section>
  );
}

function MemberPod({ pod, onChanged }: { pod: PodHome; onChanged: () => void }) {
  const [body, setBody] = useState(pod.task?.mySubmission.body || '');
  const [links, setLinks] = useState(pod.task?.mySubmission.linkUrls.join('\n') || '');
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const title = pod.isCaptain ? `קפטן · ${pod.name}` : 'הפוד שלי';

  const submit = async () => {
    if (!pod.task) return;
    setPending('task');
    setError('');
    try {
      await podsApi.submitTask(pod.id, pod.task.id, body, links.split(/[\n,]/).map((item) => item.trim()).filter(Boolean));
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההגשה נכשלה');
    } finally {
      setPending('');
    }
  };

  const ask = async () => {
    setPending('ask');
    setError('');
    try {
      await podsApi.ask(pod.id, question);
      setQuestion('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'השאלה לא נשלחה');
    } finally {
      setPending('');
    }
  };

  const join = async () => {
    setPending('join');
    setError('');
    try {
      const result = await podsApi.joinSession(pod.id);
      window.open(result.meetingUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'אין קישור פגישה');
    } finally {
      setPending('');
    }
  };

  return (
    <div className="mt-6 grid gap-6">
      <header className="glass-card p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#b79043] mb-2">{POD_KIND_LABELS[pod.kind]}</p>
        <h1 className="text-3xl font-light text-white">{title}</h1>
        <p className="mt-2 text-sm text-white/55">
          {POD_STATUS_LABELS[pod.status]} · שבוע <Bidi kind="ltr">{String(pod.currentWeek)}</Bidi>
          {pod.myStatus !== 'active' ? ` · ${POD_MEMBER_STATUS_LABELS[pod.myStatus]}` : ''}
        </p>
        {pod.groupNotice ? <p className="mt-4 text-sm text-[#dfc47d] leading-relaxed">{pod.groupNotice}</p> : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-card p-6">
          <div className="flex items-center gap-4">
            {pod.captain?.avatar ? (
              <img src={pod.captain.avatar} alt="" className="h-16 w-16 rounded-full object-cover border border-[#b79043]/40" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#b79043]/40 bg-[#b79043]/10 text-[#dfc47d] text-xl">
                {nameInitial(pod.captain?.name || 'ק')}
              </span>
            )}
            <div>
              <p className="text-xs text-white/45">הקפטן</p>
              <h2 className="text-xl text-white">{pod.captain?.name || 'טרם מונה'}</h2>
              {pod.session?.startsAt ? (
                <p className="text-sm text-white/55 mt-1">
                  פגישה הבאה: <Bidi kind="ltr">{formatWhen(pod.session.startsAt)}</Bidi>
                </p>
              ) : (
                <p className="text-sm text-white/45 mt-1">מועד הפגישה יפורסם כאן</p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-gold mt-5 min-h-11 w-full sm:w-auto"
            disabled={!pod.canJoinMeeting || pending === 'join'}
            onClick={() => void join()}
          >
            כניסה לפגישה
          </button>
          {!pod.canJoinMeeting ? (
            <p className="mt-3 text-xs text-white/45">
              {pod.myStatus === 'paused' ? 'קריאה בלבד עד שהפעימה הבאה תשולם.' : 'הכפתור נפתח כשיש קישור פגישה וסטטוס פעיל.'}
            </p>
          ) : null}
        </article>

        <article className="glass-card p-6">
          <h2 className="text-lg text-white mb-3">חברי הפוד</h2>
          <ul className="grid gap-2">
            {pod.members.map((member) => (
              <li key={`${member.firstName}-${member.initial}`} className="flex items-center gap-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[#dfc47d]">
                  {member.initial}
                </span>
                <span>{member.firstName}</span>
                {member.status !== 'active' ? (
                  <span className="text-xs text-white/40">{POD_MEMBER_STATUS_LABELS[member.status]}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl text-white">משימת השבוע</h2>
            {pod.task ? (
              <p className="text-sm text-white/55 mt-1">
                שבוע <Bidi kind="ltr">{String(pod.task.weekIndex)}</Bidi>
                {' · '}
                הגישו <Bidi kind="ltr">{String(pod.task.submittedCount)}</Bidi>
                {' מתוך '}
                <Bidi kind="ltr">{String(pod.task.memberCount)}</Bidi>
              </p>
            ) : (
              <p className="text-sm text-white/45 mt-1">הקפטן עוד לא פתח משימה לשבוע הזה.</p>
            )}
          </div>
          {pod.task ? (
            <StatusMark label={POD_TASK_STATUS_LABELS[pod.task.mySubmission.status]} tone={taskTone(pod.task.mySubmission.status)} />
          ) : null}
        </div>
        {pod.task ? (
          <>
            <h3 className="mt-4 text-lg text-[#dfc47d]">{pod.task.title}</h3>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">{pod.task.brief}</p>
            {pod.task.mySubmission.captainNote ? (
              <p className="mt-3 text-sm text-white/80">משוב הקפטן: {pod.task.mySubmission.captainNote}</p>
            ) : null}
            <label className="mt-5 block text-sm text-white/70">
              ההגשה
              <textarea
                className="mt-2 w-full min-h-28 rounded-xl border border-white/10 bg-black/30 p-3 text-white"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                disabled={!pod.canSubmit}
              />
            </label>
            <label className="mt-4 block text-sm text-white/70">
              קישורים (שורה לכל קישור)
              <textarea
                className="mt-2 w-full min-h-20 rounded-xl border border-white/10 bg-black/30 p-3 text-white"
                value={links}
                onChange={(event) => setLinks(event.target.value)}
                disabled={!pod.canSubmit}
              />
            </label>
            <button type="button" className="btn-gold mt-4 min-h-11" disabled={!pod.canSubmit || pending === 'task'} onClick={() => void submit()}>
              שליחת הגשה
            </button>
          </>
        ) : null}
      </article>

      <article className="glass-card p-6">
        <h2 className="text-xl text-white mb-2">שאלה לקפטן</h2>
        <p className="text-sm text-white/45 mb-4">השרשור פרטי בינך לבין הקפטן. זה לא שאלות על הרצאה.</p>
        <label className="block text-sm text-white/70">
          שאלה
          <textarea
            className="mt-2 w-full min-h-24 rounded-xl border border-white/10 bg-black/30 p-3 text-white"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={!pod.canSubmit}
          />
        </label>
        <button type="button" className="btn-secondary mt-4 min-h-11" disabled={!pod.canSubmit || pending === 'ask'} onClick={() => void ask()}>
          שליחת שאלה
        </button>
        <ul className="mt-6 grid gap-3">
          {pod.questions.filter((item) => item.mine || pod.isCaptain).map((item) => (
            <li key={item.id} className="rounded-2xl border border-white/10 p-4">
              <p className="text-sm text-white">{item.body}</p>
              {item.answerBody ? <p className="mt-2 text-sm text-[#dfc47d]">{item.answerBody}</p> : <p className="mt-2 text-xs text-white/40">ממתין לתשובה</p>}
            </li>
          ))}
        </ul>
      </article>
      {error ? <p role="alert" className="text-[#dfc47d]">{error}</p> : null}
    </div>
  );
}

function CaptainDesk({ pod, onChanged }: { pod: PodHome; onChanged: () => void }) {
  const [title, setTitle] = useState(pod.task?.title || '');
  const [brief, setBrief] = useState(pod.task?.brief || '');
  const [week, setWeek] = useState(String(pod.currentWeek));
  const [meetingUrl, setMeetingUrl] = useState(pod.session?.meetingUrl || '');
  const [startsAt, setStartsAt] = useState(pod.session?.startsAt ? pod.session.startsAt.slice(0, 16) : '');
  const [notes, setNotes] = useState(pod.session?.notes || '');
  const [notice, setNotice] = useState(pod.groupNotice || '');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');

  const run = async (key: string, work: () => Promise<unknown>) => {
    setPending(key);
    setError('');
    try {
      await work();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הפעולה נכשלה');
    } finally {
      setPending('');
    }
  };

  return (
    <div className="mt-10 grid gap-6">
      <h2 className="text-2xl font-light text-white">אזור קפטן</h2>
      <article className="glass-card overflow-x-auto p-6">
        <h3 className="text-lg text-white mb-4">חברים</h3>
        <table className="w-full min-w-[520px] text-sm text-start">
          <thead>
            <tr className="text-white/45">
              <th className="pb-3 font-normal">שם</th>
              <th className="pb-3 font-normal">חבר</th>
              <th className="pb-3 font-normal">הגשה</th>
              <th className="pb-3 font-normal">משוב</th>
            </tr>
          </thead>
          <tbody>
            {pod.captainView?.members.map((member) => (
              <tr key={member.userId} className="border-t border-white/10">
                <td className="py-3">
                  {member.firstName}
                  {member.role === 'captain' ? ' · קפטן' : ''}
                </td>
                <td className="py-3">{POD_MEMBER_STATUS_LABELS[member.memberStatus]}</td>
                <td className="py-3">
                  <StatusMark label={POD_TASK_STATUS_LABELS[member.submissionStatus]} tone={taskTone(member.submissionStatus)} />
                </td>
                <td className="py-3">
                  {member.submissionId && member.role !== 'captain' ? (
                    <div className="flex flex-wrap gap-2">
                      <input
                        className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-white"
                        value={reviewNotes[member.submissionId] ?? member.captainNote}
                        onChange={(event) => setReviewNotes((current) => ({ ...current, [member.submissionId!]: event.target.value }))}
                        aria-label={`משוב ל${member.firstName}`}
                      />
                      <button
                        type="button"
                        className="btn-secondary min-h-11 px-3"
                        disabled={pending === member.submissionId}
                        onClick={() =>
                          void run(member.submissionId!, () =>
                            podsApi.review(member.submissionId!, 'reviewed', reviewNotes[member.submissionId!] ?? member.captainNote)
                          )
                        }
                      >
                        נבדק
                      </button>
                      <button
                        type="button"
                        className="min-h-11 rounded-full border border-amber-300/40 px-3 text-amber-200"
                        disabled={pending === member.submissionId}
                        onClick={() =>
                          void run(member.submissionId!, () =>
                            podsApi.review(member.submissionId!, 'stuck', reviewNotes[member.submissionId!] ?? member.captainNote)
                          )
                        }
                      >
                        תקוע
                      </button>
                    </div>
                  ) : (
                    <span className="text-white/35">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="glass-card p-6 grid gap-4">
        <h3 className="text-lg text-white">משימת השבוע</h3>
        <label className="text-sm text-white/70">
          שבוע
          <input className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-white" value={week} onChange={(event) => setWeek(event.target.value)} />
        </label>
        <label className="text-sm text-white/70">
          כותרת
          <input className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-white" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="text-sm text-white/70">
          הנחיה
          <textarea className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white" value={brief} onChange={(event) => setBrief(event.target.value)} />
        </label>
        <button
          type="button"
          className="btn-gold min-h-11 w-fit"
          disabled={pending === 'task'}
          onClick={() => void run('task', () => podsApi.saveTask(pod.id, { weekIndex: Number(week), title, brief }))}
        >
          שמירת משימה
        </button>
      </article>

      <article className="glass-card p-6 grid gap-4">
        <h3 className="text-lg text-white">פגישה</h3>
        <label className="text-sm text-white/70">
          מועד
          <input type="datetime-local" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-white" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
        </label>
        <label className="text-sm text-white/70">
          קישור
          <input className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-white" value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} dir="ltr" />
        </label>
        <label className="text-sm text-white/70">
          הערה
          <input className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-white" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button
          type="button"
          className="btn-gold min-h-11 w-fit"
          disabled={pending === 'session'}
          onClick={() =>
            void run('session', () =>
              podsApi.saveSession(pod.id, { startsAt: startsAt ? new Date(startsAt).toISOString() : undefined, meetingUrl, notes })
            )
          }
        >
          פתיחת החדר
        </button>
      </article>

      <article className="glass-card p-6 grid gap-4">
        <h3 className="text-lg text-white">תזכורת בקבוצה</h3>
        <textarea className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white" value={notice} onChange={(event) => setNotice(event.target.value)} />
        <button type="button" className="btn-secondary min-h-11 w-fit" disabled={pending === 'notice'} onClick={() => void run('notice', () => podsApi.saveNotice(pod.id, notice))}>
          פרסום במסך
        </button>
      </article>

      <article className="glass-card p-6 grid gap-4">
        <h3 className="text-lg text-white">שאלות פתוחות</h3>
        {pod.questions.filter((item) => item.status === 'open').map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4 grid gap-3">
            <p className="text-sm text-white">{item.firstName}: {item.body}</p>
            <textarea
              className="min-h-20 rounded-xl border border-white/10 bg-black/30 p-3 text-white"
              value={answers[item.id] || ''}
              onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))}
            />
            <button type="button" className="btn-gold min-h-11 w-fit" disabled={pending === item.id} onClick={() => void run(item.id, () => podsApi.answer(item.id, answers[item.id] || ''))}>
              שליחת תשובה
            </button>
          </div>
        ))}
      </article>
      {error ? <p role="alert" className="text-[#dfc47d]">{error}</p> : null}
    </div>
  );
}
