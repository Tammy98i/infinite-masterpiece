import { useEffect, useState } from 'react';
import { teamMembersApi } from '../../api/teamMembers';
import { FileUploadField } from '../../components/FileUploadField';
import { TEAM_LEVELS, TEAM_LEVEL_LABELS, starDiameter, type TeamMember, type TeamMemberInput, type TeamLevel } from '../../lib/teamMembers';
import { fieldClass } from './adminConstants';

const emptyMember = (order: number): TeamMemberInput => ({ name: '', role: '', photo: '', bio: '', vision: '', contribution: '', responsibilities: [], expertise: [], impact_score: 55, hierarchy_level: 'core', orbit: 2, active: true, display_order: order });

export function TeamMembersPanel() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<TeamMember | 'new' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { teamMembersApi.adminList().then(res => setMembers(res.members)).catch(err => setError(err.message)).finally(() => setLoading(false)); }, []);
  return <section className="grid gap-6" aria-labelledby="team-members-admin-title" dir="rtl">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs tracking-widest text-[#b79043] mb-2" dir="ltr">TEAM MEMBERS</p><h2 id="team-members-admin-title" className="text-2xl font-light">גלקסיית הצוות</h2>
        <p className="text-sm text-white/55 mt-2">כל פרופיל פעיל מופיע ב־THE PEOPLE BEHIND THE VISION. פרופיל חדש מוצג מיד אחרי השמירה.</p></div>
      {!editing && <button type="button" className="px-5 py-3 border border-[#b79043]/50 rounded-full text-[#dfc47d] min-h-11" onClick={() => { setNotice(''); setEditing('new'); }}>הוספת איש צוות לגלקסיה</button>}
    </header>
    <p className="text-xs text-white/55 border border-[#b79043]/25 rounded-xl p-4 leading-relaxed">ציוני ההשפעה הראשוניים הם ערכי פתיחה לצורכי תצוגה, לא מדידה מאומתת. ניתן לערוך אותם כאן. גודל הכוכב מתעדכן לפי הציון; המייסד נשאר השמש הגדולה במרכז. הפרטים הועתקו מהצוות הקיים פעם אחת, ומנוהלים מעתה כאן באופן עצמאי.</p>
    {error && <p role="alert" className="text-[#dfc47d]">{error}</p>}
    {notice && <p role="status" className="text-[#dfc47d]">{notice}</p>}
    {loading ? <p role="status">טוענים את הצוות…</p> : editing ? <TeamMemberForm member={editing === 'new' ? null : editing} nextOrder={members.reduce((max, item) => Math.max(max, item.display_order), -1) + 1} onCancel={() => setEditing(null)} onSaved={member => {
      setMembers(current => [...current.filter(item => item.id !== member.id), member].sort((a, b) => a.display_order - b.display_order));
      setEditing(null); setNotice('הפרופיל נשמר. הגלקסיה עודכנה.'); window.dispatchEvent(new Event('team-members-updated'));
    }} /> : <div className="grid gap-3">{members.map(member => <article key={member.id} data-team-row={member.id} className="border border-white/15 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
      <div><h3 className="text-lg">{member.name}</h3><p className="text-sm text-white/60 mt-1">{member.role}</p><p className="text-xs text-[#b79043] mt-2">{TEAM_LEVEL_LABELS[member.hierarchy_level]} · השפעה {member.impact_score} · מסלול {member.orbit} · סדר {member.display_order} · {member.active ? 'מוצג באתר' : 'מוסתר'}</p></div>
      <button type="button" aria-label={`עריכת ${member.name}`} className="px-5 py-3 rounded-full border border-[#b79043]/40 text-sm min-h-11" onClick={() => { setNotice(''); setEditing(member); }}>עריכת פרופיל</button>
    </article>)}</div>}
  </section>;
}

function TeamMemberForm({ member, nextOrder = 0, onSaved, onCancel }: { member: TeamMember | null; nextOrder?: number; onSaved: (member: TeamMember) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<TeamMemberInput>(member || emptyMember(nextOrder));
  const [responsibilities, setResponsibilities] = useState(member?.responsibilities.join('\n') || '');
  const [expertise, setExpertise] = useState(member?.expertise.join('\n') || '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const patch = <K extends keyof TeamMemberInput>(key: K, value: TeamMemberInput[K]) => setDraft(current => ({ ...current, [key]: value }));
  const lines = (value: string) => value.split('\n').map(line => line.trim()).filter(Boolean);
  return <form className="grid gap-5 max-w-3xl" data-testid="team-member-form" onSubmit={async event => {
    event.preventDefault(); setPending(true); setError('');
    try { const result = await teamMembersApi.save({ ...draft, responsibilities: lines(responsibilities), expertise: lines(expertise) }, member?.id); onSaved(result.member); }
    catch (err) { setError(err instanceof Error ? err.message : 'השמירה נכשלה'); }
    finally { setPending(false); }
  }}>
    <fieldset disabled={pending} className="grid gap-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <label>שם<input name="name" required maxLength={120} value={draft.name} onChange={e => patch('name', e.target.value)} className={fieldClass} /></label>
        <label>תפקיד<input name="role" required maxLength={160} value={draft.role} onChange={e => patch('role', e.target.value)} className={fieldClass} /></label>
      </div>
      <FileUploadField kind="image" label="תמונת פרופיל" value={draft.photo} onChange={value => patch('photo', value)} disabled={pending} previewAlt={`תמונת ${draft.name}`} />
      <label>מי אני<textarea name="bio" rows={3} maxLength={5000} value={draft.bio} onChange={e => patch('bio', e.target.value)} className={fieldClass} /></label>
      {draft.hierarchy_level === 'founder' && <label>חזון<textarea name="vision" rows={3} maxLength={5000} value={draft.vision} onChange={e => patch('vision', e.target.value)} className={fieldClass} /></label>}
      <label>התרומה שלי למיזם<textarea name="contribution" rows={3} maxLength={5000} value={draft.contribution} onChange={e => patch('contribution', e.target.value)} className={fieldClass} /></label>
      <label>תחומי אחריות — פריט בכל שורה<textarea name="responsibilities" rows={3} value={responsibilities} onChange={e => setResponsibilities(e.target.value)} className={fieldClass} /></label>
      <label>תחומי מומחיות — פריט בכל שורה<textarea name="expertise" rows={3} value={expertise} onChange={e => setExpertise(e.target.value)} className={fieldClass} /></label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label>רמת היררכיה<select name="hierarchy_level" value={draft.hierarchy_level} className={fieldClass} onChange={e => { const level = e.target.value as TeamLevel; setDraft(current => ({ ...current, hierarchy_level: level, orbit: level === 'founder' ? 0 : current.orbit || 1 })); }}>{TEAM_LEVELS.map(level => <option key={level} value={level}>{TEAM_LEVEL_LABELS[level]}</option>)}</select></label>
        <label>מסלול (Orbit)<input name="orbit" type="number" min={draft.hierarchy_level === 'founder' ? 0 : 1} max={4} required disabled={draft.hierarchy_level === 'founder'} value={draft.orbit} onChange={e => patch('orbit', Number(e.target.value))} className={fieldClass} /></label>
        <label>רמת השפעה (0–100)<input name="impact_score" type="number" required min={0} max={100} value={draft.impact_score} onChange={e => patch('impact_score', Number(e.target.value))} className={fieldClass} /></label>
        <label>סדר תצוגה<input name="display_order" type="number" required min={0} max={10000} value={draft.display_order} onChange={e => patch('display_order', Number(e.target.value))} className={fieldClass} /></label>
      </div>
      <div className="flex items-center gap-6 min-h-60 p-5 border border-[#b79043]/20 rounded-2xl overflow-hidden" aria-label="תצוגה מקדימה של גודל הכוכב">
        <span data-testid="star-size-preview" className="shrink-0 rounded-full border border-[#b79043] bg-[#b79043]/10 shadow-[0_0_25px_#b7904325]" style={{ width: starDiameter(draft), height: starDiameter(draft) }} />
        <p className="text-xs text-[#dfc47d]">Higher Impact<br />Larger Star<br /><span className="block mt-2">{draft.impact_score} / 100</span></p>
      </div>
      <label className="flex gap-3 items-center min-h-11"><input name="active" type="checkbox" checked={draft.active} onChange={e => patch('active', e.target.checked)} />הצגת איש הצוות באתר</label>
    </fieldset>
    {error && <p role="alert" className="text-[#dfc47d]">{error}</p>}
    <div className="flex gap-3"><button type="submit" disabled={pending} className="rounded-full px-6 py-3 bg-[#b79043] text-black min-h-11 disabled:opacity-50">{pending ? 'שומר…' : 'שמירת פרופיל'}</button><button type="button" disabled={pending} onClick={onCancel} className="rounded-full px-6 py-3 border border-white/20 min-h-11">ביטול</button></div>
  </form>;
}
