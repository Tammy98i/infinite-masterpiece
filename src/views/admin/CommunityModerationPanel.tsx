import { useEffect, useState } from 'react';
import { communityApi, type CommunityReport } from '../../api/community';

export function CommunityModerationPanel() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState('');

  const load = () =>
    communityApi
      .reports()
      .then((result) => setReports(result.reports))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const run = async (id: string, work: () => Promise<unknown>) => {
    setPending(id);
    setError('');
    try {
      await work();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הפעולה נכשלה');
    } finally {
      setPending('');
    }
  };

  return (
    <div className="grid gap-3 max-w-3xl text-start">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">דיווחי קהילה</h2>
          <p className="text-sm text-white/55">הסתרה משאירה את הפוסט ביומן. השתקה חוסמת פרסום חדש.</p>
        </div>
        <button type="button" onClick={() => void load()} className="px-3 py-2 rounded-full border border-white/15 text-sm min-h-11">רענון</button>
      </div>
      {error ? <p className="text-sm text-rose-300" role="alert">{error}</p> : null}
      {reports.length === 0 ? <p className="text-sm text-white/55">אין דיווחים פתוחים.</p> : null}
      {reports.map((report) => (
        <article key={report.id} className="rounded-2xl border border-white/10 p-4 grid gap-3">
          <p className="text-sm text-white/55">{report.reporterName} דיווח על {report.authorName}</p>
          <p className="text-white">{report.body}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending === report.id} className="px-3 py-2 rounded-full border border-white/15 text-sm min-h-11" onClick={() => void run(report.id, () => communityApi.hide(report.postId, !report.hidden))}>
              {report.hidden ? 'החזרה' : 'הסתרה'}
            </button>
            <button type="button" disabled={pending === report.id} className="px-3 py-2 rounded-full border border-white/15 text-sm min-h-11" onClick={() => void run(report.id, () => communityApi.mute(report.authorId, !report.muted))}>
              {report.muted ? 'ביטול השתקה' : 'השתקה'}
            </button>
            <button type="button" disabled={pending === report.id} className="px-3 py-2 rounded-full border border-white/15 text-sm min-h-11" onClick={() => void run(report.id, () => communityApi.dismissReport(report.id))}>
              סגירת דיווח
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
