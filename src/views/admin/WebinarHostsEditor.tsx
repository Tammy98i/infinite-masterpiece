import { useEffect, useState } from 'react';
import { teamMembersApi, type TeamMember } from '../../api/teamMembers';
import { localizedName, localizedRole } from '../../constants/teamGalaxySeed';
import { webinarHosts } from '../../constants/webinarHosts';
import { fieldClass } from './adminConstants';

export function WebinarHostsEditor() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState('');

  const load = () =>
    teamMembersApi
      .adminList()
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const hosts = webinarHosts(members);
  const candidates = members.filter((member) => !hosts.some((host) => host.id === member.id));

  const toggle = async (member: TeamMember, featured: boolean) => {
    setSaving(true);
    setError('');
    try {
      await teamMembersApi.adminUpdate(member.id, { ...member, featured });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid gap-4 border border-white/10 rounded-2xl p-5">
      <div>
        <h3 className="text-lg font-light">מנחי הוובינר</h3>
        <p className="text-sm text-white/45 mt-1">אותם אנשים מהצוות. סימון מנחה מציג אותם בבלוק המנחים ובמובייל למעלה.</p>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-2">
        {hosts.map((member) => (
          <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#C8A24C]/25 bg-[#C8A24C]/5">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-[#C8A24C]/40 shrink-0">
              {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#111] text-[#F7E7B5] flex items-center justify-center">{localizedName(member, 'he').charAt(0)}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white truncate">{localizedName(member, 'he')}</p>
              <p className="text-xs text-white/45 truncate">{localizedRole(member, 'he') || localizedRole(member, 'en')}</p>
            </div>
            <button type="button" disabled={saving} className="min-h-11 px-3 text-rose-200/80 text-sm" onClick={() => void toggle(member, false)}>
              הסרה מהמנחים
            </button>
          </div>
        ))}
        {hosts.length === 0 ? <p className="text-sm text-white/40">אין מנחים מסומנים. הוסיפו מהרשימה.</p> : null}
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="grid gap-1 text-sm flex-1 min-w-[220px]">
          <span className="text-white/50">הוספת מנחה מתוך הצוות</span>
          <select className={fieldClass} value={pick} onChange={(e) => setPick(e.target.value)} aria-label="בחירת איש צוות למנחים">
            <option value="">בחירה…</option>
            {candidates.map((member) => (
              <option key={member.id} value={member.id}>{localizedName(member, 'he')}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!pick || saving}
          className="px-4 py-2 rounded-full bg-[#C8A24C] text-black text-sm min-h-11 disabled:opacity-40"
          onClick={() => {
            const member = members.find((row) => row.id === pick);
            if (!member) return;
            setPick('');
            void toggle(member, true);
          }}
        >
          הוספה למנחים
        </button>
      </div>
    </section>
  );
}
