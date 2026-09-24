import { useEffect, useState } from 'react';
import { podsApi, type AdminPodRow, type QueueItem } from '../../api/pods';
import { AdminPageShell } from './AdminPageShell';
import { fieldClass } from './adminConstants';
import { Bidi } from '../../components/Bidi';
import { DeskMonogram } from '../../components/DeskMonogram';
import { POD_KIND_LABELS, POD_STATUS_LABELS, defaultPodCapacity, type PodKind, type PodStatus } from '../../lib/pods';

const SOURCE_LABEL: Record<QueueItem['source'], string> = {
  brave: 'אמיצים · תשלום מלא',
  hesitant: 'הססנים · פעימה ראשונה',
  premium_88: 'נבחרת 88 · אושר',
};

export function PodsPanel() {
  const [pods, setPods] = useState<AdminPodRow[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [libraryOnly, setLibraryOnly] = useState<Array<{ userId: string; name: string; email: string; stamp: string }>>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<PodKind>('journey');
  const [captainUserId, setCaptainUserId] = useState('');
  const [assigning, setAssigning] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    Promise.all([podsApi.adminList(), podsApi.queue()])
      .then(([list, q]) => {
        setPods(list.pods);
        setQueue(q.queue);
        setLibraryOnly(q.libraryOnly);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינת הפודים נכשלה'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setError('');
    try {
      await podsApi.create({
        name,
        kind,
        captainUserId: captainUserId.trim() || undefined,
        capacity: defaultPodCapacity(kind),
      });
      setName('');
      setCaptainUserId('');
      setNotice('הפוד נוצר.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירת הפוד נכשלה');
    }
  };

  const assign = async (userId: string, itemKind: PodKind) => {
    const podId = assigning[userId];
    if (!podId) return;
    setError('');
    try {
      await podsApi.assign(podId, userId);
      setNotice('החבר שויך לפוד.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'השיוך נכשל');
    }
    void itemKind;
  };

  const closePod = async (id: string) => {
    setError('');
    try {
      await podsApi.update(id, { status: 'closed' });
      setNotice('הפוד נסגר.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הסגירה נכשלה');
    }
  };

  const setStatus = async (id: string, status: PodStatus) => {
    try {
      await podsApi.update(id, { status });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'עדכון הסטטוס נכשל');
    }
  };

  return (
    <AdminPageShell group="מסחר והכנסות" title="פודים" description="תור שיוך קודם. מנוי ספרייה לא נכנס לתור.">
      {error ? <p role="alert" className="text-[#dfc47d]">{error}</p> : null}
      {notice ? <p role="status" className="text-[#dfc47d]">{notice}</p> : null}
      {loading ? <p role="status">טוענים פודים…</p> : null}

      <section className="grid gap-3">
        <h2 className="text-base text-white">תור שיוך</h2>
        {queue.length === 0 ? <p className="text-white/45 text-sm">אין ממתינים לשיוך.</p> : null}
        <div className="grid gap-2">
          {queue.map((item) => (
            <article key={`${item.userId}-${item.kind}`} className="crm-desk-panel p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="crm-desk-who">
                <DeskMonogram name={item.name} />
                <span className="crm-desk-who-text">
                  <span className="crm-desk-who-name">{item.name}</span>
                  <span className="text-xs text-white/55 mt-1 block">
                    {SOURCE_LABEL[item.source]} · {POD_KIND_LABELS[item.kind]}
                  </span>
                  <span className="crm-desk-who-mail">
                    <Bidi kind="email">{item.email}</Bidi>
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className={fieldClass}
                  value={assigning[item.userId] || ''}
                  onChange={(event) => setAssigning((current) => ({ ...current, [item.userId]: event.target.value }))}
                  aria-label={`בחירת פוד ל${item.name}`}
                >
                  <option value="">בחרו פוד פתוח</option>
                  {pods
                    .filter((pod) => pod.kind === item.kind && pod.status !== 'closed' && pod.occupied < pod.capacity)
                    .map((pod) => (
                      <option key={pod.id} value={pod.id}>
                        {pod.name} ({pod.occupied}/{pod.capacity})
                      </option>
                    ))}
                </select>
                <button type="button" className="btn-gold min-h-11" onClick={() => void assign(item.userId, item.kind)}>
                  שייך לפוד
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-base text-white">רשימת פודים</h2>
        <div className="grid gap-2">
          {pods.map((pod) => (
            <article key={pod.id} className="crm-desk-panel p-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-white text-sm">{pod.name}</h3>
                <p className="text-xs text-white/55 mt-1">
                  {POD_KIND_LABELS[pod.kind]} · {POD_STATUS_LABELS[pod.status]} · קפטן {pod.captain?.name || 'טרם מונה'} ·{' '}
                  <Bidi kind="ltr">{String(pod.occupied)}</Bidi>/<Bidi kind="ltr">{String(pod.capacity)}</Bidi>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pod.status !== 'active' && pod.captain ? (
                  <button type="button" className="btn-secondary min-h-11 px-4" onClick={() => void setStatus(pod.id, 'active')}>
                    הפעלה
                  </button>
                ) : null}
                {pod.status !== 'closed' ? (
                  <button type="button" className="min-h-11 rounded-full border border-white/20 px-4" onClick={() => void closePod(pod.id)}>
                    סגירה
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <details className="crm-desk-fold">
        <summary>
          <span>פוד חדש</span>
          <span className="text-xs text-white/40">קיפול · רשימה קודם</span>
        </summary>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-white/70">
            שם
            <input className={`${fieldClass} mt-2`} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="text-sm text-white/70">
            סוג
            <select className={`${fieldClass} mt-2`} value={kind} onChange={(event) => setKind(event.target.value as PodKind)}>
              <option value="journey">מסע</option>
              <option value="micro_88">Micro-Pod · 88</option>
            </select>
          </label>
          <label className="text-sm text-white/70">
            מזהה קפטן (אופציונלי)
            <input className={`${fieldClass} mt-2`} value={captainUserId} onChange={(event) => setCaptainUserId(event.target.value)} dir="ltr" />
          </label>
          <button type="button" className="btn-gold self-end min-h-11" onClick={() => void create()}>
            יצירת פוד
          </button>
        </div>
      </details>

      <section className="grid gap-2">
        <h2 className="text-base text-white">לא נכנסו לתור</h2>
        <p className="text-sm text-white/45">מנוי ספרייה בלבד, בלי תשלום מסע ובלי אישור 88.</p>
        <ul className="grid gap-1">
          {libraryOnly.slice(0, 12).map((item) => (
            <li key={item.userId} className="text-sm text-white/60">
              {item.name} · {item.stamp}
            </li>
          ))}
        </ul>
      </section>
    </AdminPageShell>
  );
}
