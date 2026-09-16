import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Archive, ChevronDown, ChevronUp, Copy, Plus, X } from 'lucide-react';
import { teamMembersApi, type TeamMember } from '../../api/teamMembers';
import { TEAM_SECTION_DEFAULTS, localizedName, localizedRole, type TeamSectionSettings } from '../../constants/teamGalaxySeed';
import { FileUploadField } from '../../components/FileUploadField';
import { fieldClass } from './adminConstants';
import { TeamGalaxy } from '../../marketing/components/TeamGalaxy/TeamGalaxy';

const GROUPS = [
  { value: 'founder', label: 'מייסד' },
  { value: 'leadership', label: 'אנשי מפתח' },
  { value: 'core', label: 'צוות ליבה' },
  { value: 'contributor', label: 'שותפים' },
  { value: 'ecosystem', label: 'אקוסיסטם' },
];

const TIERS = [
  { value: 'hero', label: 'Hero' },
  { value: 'large', label: 'Large' },
  { value: 'medium', label: 'Medium' },
  { value: 'small', label: 'Small' },
];

const STATUSES = [
  { value: 'draft', label: 'טיוטה' },
  { value: 'published', label: 'מפורסם' },
  { value: 'hidden', label: 'מוסתר' },
];

const EMPTY_FORM: Partial<TeamMember> = {
  name_he: '',
  name_en: '',
  role_he: '',
  role_en: '',
  photo: '',
  photo_alt: '',
  quote: '',
  bio: '',
  contribution: '',
  vision: '',
  closing_quote: '',
  responsibilities: [],
  expertise: [],
  impact_score: 50,
  group_key: 'core',
  hierarchy_level: 'core',
  visual_tier: 'medium',
  featured: false,
  status: 'draft',
  display_order: 0,
  orbit: 2,
  professional_url: '',
};

type InnerTab = 'settings' | 'members';
type PreviewSize = 'desktop' | 'tablet' | 'mobile' | null;

export function TeamGalaxyAdminView() {
  const [innerTab, setInnerTab] = useState<InnerTab>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [draft, setDraft] = useState<TeamSectionSettings>(TEAM_SECTION_DEFAULTS);
  const [live, setLive] = useState<TeamSectionSettings>(TEAM_SECTION_DEFAULTS);
  const [updatedAt, setUpdatedAt] = useState('');
  const [versions, setVersions] = useState<Array<{ id: number; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<TeamMember> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [preview, setPreview] = useState<PreviewSize>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, section] = await Promise.all([teamMembersApi.adminList(), teamMembersApi.adminSection()]);
      setMembers(list);
      setDraft({ ...TEAM_SECTION_DEFAULTS, ...section.draft });
      setLive({ ...TEAM_SECTION_DEFAULTS, ...section.live });
      setUpdatedAt(section.draft.updated_at || section.live.updated_at || '');
      setVersions(section.versions.map((v) => ({ id: v.id, created_at: v.created_at })));
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינה נכשלה');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const name = `${localizedName(m, 'he')} ${localizedName(m, 'en')} ${localizedRole(m, 'he')} ${localizedRole(m, 'en')}`.toLowerCase();
      if (q && !name.includes(q)) return false;
      if (groupFilter && (m.group_key || m.hierarchy_level) !== groupFilter) return false;
      if (statusFilter && (m.status || (m.active ? 'published' : 'hidden')) !== statusFilter) return false;
      if (tierFilter && m.visual_tier !== tierFilter) return false;
      return true;
    });
  }, [members, query, groupFilter, statusFilter, tierFilter]);

  const saveDraft = async () => {
    setSaving(true);
    setError('');
    try {
      const section = await teamMembersApi.adminSaveSection(draft);
      setDraft({ ...TEAM_SECTION_DEFAULTS, ...section.draft });
      setLive({ ...TEAM_SECTION_DEFAULTS, ...section.live });
      setUpdatedAt(section.draft.updated_at || '');
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירת טיוטה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setSaving(true);
    setError('');
    try {
      await teamMembersApi.adminSaveSection(draft);
      const section = await teamMembersApi.adminPublishSection();
      setDraft({ ...TEAM_SECTION_DEFAULTS, ...section.draft });
      setLive({ ...TEAM_SECTION_DEFAULTS, ...section.live });
      setUpdatedAt(section.live.updated_at || '');
      setVersions(section.versions.map((v) => ({ id: v.id, created_at: v.created_at })));
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'פרסום נכשל');
    } finally {
      setSaving(false);
    }
  };

  const saveMember = async () => {
    if (!editing) return;
    const nameHe = (editing.name_he || editing.name || '').trim();
    const nameEn = (editing.name_en || '').trim();
    if (!nameHe && !nameEn) return;
    if (editing.photo && !(editing.photo_alt || '').trim()) {
      setError('טקסט חלופי לתמונה הוא שדה חובה כשיש תמונה');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...editing,
        name: nameHe || nameEn,
        name_he: nameHe || nameEn,
        name_en: nameEn || nameHe,
        role: editing.role_en || editing.role_he || editing.role || '',
        hierarchy_level: editing.group_key || editing.hierarchy_level,
      };
      if (isNew) {
        await teamMembersApi.adminCreate(payload);
      } else if (editing.id) {
        await teamMembersApi.adminUpdate(editing.id, payload);
      }
      setEditing(null);
      setIsNew(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...members];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    setMembers(next);
    try {
      await teamMembersApi.adminReorder(next.map((m) => m.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שינוי סדר נכשל');
      await load();
    }
  };

  if (loading) {
    return <div className="text-white/50 text-sm p-8 text-center">טוען...</div>;
  }

  const previewWidth = preview === 'mobile' ? 375 : preview === 'tablet' ? 768 : 1180;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div>
          <h2 className="text-xl text-white font-medium">שקופית הצוות</h2>
          <p className="text-sm text-white/40">
            {live.published ? 'פורסם' : 'טיוטה'} · עודכן {updatedAt ? new Date(updatedAt).toLocaleString('he-IL') : '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={ghostBtn} onClick={() => setPreview(preview ? null : 'desktop')}>
            תצוגה מקדימה
          </button>
          <button type="button" className={ghostBtn} onClick={() => void saveDraft()} disabled={saving}>
            שמירת טיוטה
          </button>
          <button type="button" className={goldBtn} onClick={() => void publish()} disabled={saving}>
            פרסום
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">{error}</div>
      )}

      <div className="flex gap-2 border-b border-white/10 pb-2" role="tablist" aria-label="אזורי ניהול שקופית הצוות">
        <TabButton active={innerTab === 'settings'} onClick={() => setInnerTab('settings')}>
          הגדרות השקופית
        </TabButton>
        <TabButton active={innerTab === 'members'} onClick={() => setInnerTab('members')}>
          אנשי הצוות
        </TabButton>
      </div>

      {preview && (
        <div className="rounded-2xl border border-white/10 p-4 bg-black/40">
          <div className="flex gap-2 mb-4">
            {(['desktop', 'tablet', 'mobile'] as const).map((size) => (
              <button key={size} type="button" className={preview === size ? goldBtn : ghostBtn} onClick={() => setPreview(size)}>
                {size === 'desktop' ? 'Desktop' : size === 'tablet' ? 'Tablet' : 'Mobile'}
              </button>
            ))}
            <button type="button" className={ghostBtn} onClick={() => setPreview(null)}>סגירה</button>
          </div>
          <div className="overflow-auto max-h-[70vh] border border-white/10 rounded-xl">
            <div style={{ width: previewWidth, maxWidth: '100%' }} className="mx-auto">
              <TeamGalaxy preview={{ settings: draft, members: members.filter((m) => m.status === 'published' || m.active) }} />
            </div>
          </div>
        </div>
      )}

      {innerTab === 'settings' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="כותרת בעברית">
            <input className={fieldClass} value={draft.title_he} onChange={(e) => { setDraft({ ...draft, title_he: e.target.value }); setDirty(true); }} />
          </Field>
          <Field label="כותרת באנגלית">
            <input className={fieldClass} dir="ltr" value={draft.title_en} onChange={(e) => { setDraft({ ...draft, title_en: e.target.value }); setDirty(true); }} />
          </Field>
          <Field label="תיאור בעברית">
            <input className={fieldClass} value={draft.subtitle_he} onChange={(e) => { setDraft({ ...draft, subtitle_he: e.target.value }); setDirty(true); }} />
          </Field>
          <Field label="תיאור באנגלית">
            <input className={fieldClass} dir="ltr" value={draft.subtitle_en} onChange={(e) => { setDraft({ ...draft, subtitle_en: e.target.value }); setDirty(true); }} />
          </Field>
          <Field label="תווית האקוסיסטם">
            <input className={fieldClass} value={draft.ecosystem_label_he} onChange={(e) => { setDraft({ ...draft, ecosystem_label_he: e.target.value }); setDirty(true); }} />
          </Field>
          <Field label="רמז גלילה במובייל">
            <input className={fieldClass} value={draft.mobile_hint} onChange={(e) => { setDraft({ ...draft, mobile_hint: e.target.value }); setDirty(true); }} />
          </Field>
          <Field label="טקסט כפתור הצגת כל הצוות">
            <input className={fieldClass} value={draft.show_all_label} onChange={(e) => { setDraft({ ...draft, show_all_label: e.target.value }); setDirty(true); }} />
          </Field>
          <div className="md:col-span-2 flex flex-wrap gap-4 text-sm text-white/70">
            <Toggle label="הצגת Impact" checked={draft.show_impact} onChange={(v) => { setDraft({ ...draft, show_impact: v }); setDirty(true); }} />
            <Toggle label="הצגת ציטוטים" checked={draft.show_quotes} onChange={(v) => { setDraft({ ...draft, show_quotes: v }); setDirty(true); }} />
            <Toggle label="הצגת מומחיות" checked={draft.show_expertise} onChange={(v) => { setDraft({ ...draft, show_expertise: v }); setDirty(true); }} />
            <Toggle label="הצגת קישורים" checked={draft.show_links} onChange={(v) => { setDraft({ ...draft, show_links: v }); setDirty(true); }} />
          </div>
          {versions.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-xs text-white/40 mb-2">שחזור גרסה</p>
              <div className="flex flex-wrap gap-2">
                {versions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={ghostBtn}
                    onClick={async () => {
                      try {
                        const section = await teamMembersApi.adminRestoreSection(v.id);
                        setDraft({ ...TEAM_SECTION_DEFAULTS, ...section.draft });
                        setDirty(true);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'שחזור נכשל');
                      }
                    }}
                  >
                    {new Date(v.created_at).toLocaleString('he-IL')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <input className={`${fieldClass} max-w-xs`} placeholder="חיפוש לפי שם או תפקיד" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className={fieldClass} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} aria-label="סינון לפי קבוצה">
              <option value="">כל הקבוצות</option>
              {GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
            <select className={fieldClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="סינון לפי סטטוס">
              <option value="">כל הסטטוסים</option>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className={fieldClass} value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} aria-label="סינון לפי הדגשה">
              <option value="">כל הרמות</option>
              {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button type="button" className={goldBtn} onClick={() => { setEditing({ ...EMPTY_FORM, display_order: members.length }); setIsNew(true); }}>
              <Plus className="w-4 h-4" /> הוספת איש צוות
            </button>
          </div>

          <div className="grid gap-2">
            {filtered.map((m) => {
              const idx = members.findIndex((row) => row.id === m.id);
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex flex-col">
                    <button type="button" className="w-11 h-11 text-white/50" aria-label="העלאה בסדר" onClick={() => void move(idx, -1)}><ChevronUp className="w-4 h-4 mx-auto" /></button>
                    <button type="button" className="w-11 h-11 text-white/50" aria-label="הורדה בסדר" onClick={() => void move(idx, 1)}><ChevronDown className="w-4 h-4 mx-auto" /></button>
                  </div>
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-[#C8A24C]/30 shrink-0">
                    {m.photo ? <img src={m.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#111] text-[#F7E7B5] flex items-center justify-center">{localizedName(m, 'he').charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{localizedName(m, 'he')}</p>
                    <p className="text-xs text-white/45 truncate" dir="ltr">{localizedRole(m, 'en')} · {m.group_key} · {m.visual_tier}</p>
                  </div>
                  <span className="text-xs text-white/40">{STATUSES.find((s) => s.value === (m.status || 'published'))?.label}</span>
                  <button type="button" className="min-h-11 px-2 text-[#C8A24C]" onClick={() => { setEditing({ ...m }); setIsNew(false); }}>עריכה</button>
                  <button type="button" className="min-h-11 px-2 text-white/50" aria-label="שכפול" onClick={() => void teamMembersApi.adminDuplicate(m.id).then(load)}><Copy className="w-4 h-4" /></button>
                  <button type="button" className="min-h-11 px-2 text-rose-300/70" aria-label="ארכוב" onClick={() => { if (confirm('להעביר לארכיון?')) void teamMembersApi.adminDelete(m.id).then(load); }}><Archive className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80" onClick={() => { if (!dirty || confirm('לצאת בלי לשמור?')) { setEditing(null); setIsNew(false); } }}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#C8A24C]/20 bg-[#0a0a0a] p-6" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => { setEditing(null); setIsNew(false); }} className="absolute top-4 left-4 w-11 h-11 rounded-full border border-white/10 text-white/50" aria-label="סגירה"><X className="w-4 h-4 mx-auto" /></button>
            <h3 className="text-lg text-white mb-4">{isNew ? 'איש צוות חדש' : 'עריכת איש צוות'}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="שם מלא בעברית"><input className={fieldClass} value={editing.name_he || editing.name || ''} onChange={(e) => setEditing({ ...editing, name_he: e.target.value, name: e.target.value })} /></Field>
              <Field label="שם מלא באנגלית"><input className={fieldClass} dir="ltr" value={editing.name_en || ''} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></Field>
              <Field label="תפקיד בעברית"><input className={fieldClass} value={editing.role_he || ''} onChange={(e) => setEditing({ ...editing, role_he: e.target.value })} /></Field>
              <Field label="תפקיד באנגלית"><input className={fieldClass} dir="ltr" value={editing.role_en || editing.role || ''} onChange={(e) => setEditing({ ...editing, role_en: e.target.value, role: e.target.value })} /></Field>
              <div className="md:col-span-2">
                <Field label="תמונת פרופיל">
                  <FileUploadField kind="image" label="העלאת תמונה" value={editing.photo || ''} onChange={(url) => setEditing({ ...editing, photo: url })} previewAlt={editing.photo_alt || editing.name_he || 'תמונת פרופיל'} />
                </Field>
              </div>
              <Field label="טקסט חלופי לתמונה"><input className={fieldClass} value={editing.photo_alt || ''} onChange={(e) => setEditing({ ...editing, photo_alt: e.target.value })} /></Field>
              <Field label="משפט פתיחה"><input className={fieldClass} value={editing.quote || ''} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} /></Field>
              <div className="md:col-span-2"><Field label="מי אני"><textarea className={fieldClass} rows={3} value={editing.bio || ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></Field></div>
              <div className="md:col-span-2"><Field label="התרומה שלי למיזם"><textarea className={fieldClass} rows={3} value={editing.contribution || ''} onChange={(e) => setEditing({ ...editing, contribution: e.target.value })} /></Field></div>
              <div className="md:col-span-2"><Field label="תחומי אחריות (שורה לכל פריט)"><textarea className={fieldClass} rows={3} value={(editing.responsibilities || []).join('\n')} onChange={(e) => setEditing({ ...editing, responsibilities: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} /></Field></div>
              <div className="md:col-span-2"><Field label="תחומי מומחיות (פסיקים)"><input className={fieldClass} value={(editing.expertise || []).join(', ')} onChange={(e) => setEditing({ ...editing, expertise: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} /></Field></div>
              <div className="md:col-span-2"><Field label="חזון"><textarea className={fieldClass} rows={2} value={editing.vision || ''} onChange={(e) => setEditing({ ...editing, vision: e.target.value })} /></Field></div>
              <div className="md:col-span-2"><Field label="ציטוט מסכם"><input className={fieldClass} value={editing.closing_quote || ''} onChange={(e) => setEditing({ ...editing, closing_quote: e.target.value })} /></Field></div>
              <Field label="קבוצה">
                <select className={fieldClass} value={editing.group_key || 'core'} onChange={(e) => {
                  const group_key = e.target.value;
                  const orbit = group_key === 'founder' ? 0 : group_key === 'leadership' ? 1 : group_key === 'contributor' || group_key === 'ecosystem' ? 3 : 2;
                  setEditing({ ...editing, group_key, hierarchy_level: group_key, orbit });
                }}>
                  {GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </Field>
              <Field label="רמת הדגשה">
                <select className={fieldClass} value={editing.visual_tier || 'medium'} onChange={(e) => setEditing({ ...editing, visual_tier: e.target.value })}>
                  {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="ציון Impact">
                <input type="number" min={0} max={100} className={fieldClass} value={editing.impact_score ?? 50} onChange={(e) => setEditing({ ...editing, impact_score: Number(e.target.value) })} />
              </Field>
              <Field label="מסלול (Orbit)">
                <input type="number" min={0} max={3} className={fieldClass} value={editing.orbit ?? 2} onChange={(e) => setEditing({ ...editing, orbit: Number(e.target.value) })} />
              </Field>
              <Field label="סדר תצוגה">
                <input type="number" min={0} className={fieldClass} value={editing.display_order ?? 0} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
              </Field>
              <Field label="סטטוס">
                <select className={fieldClass} value={editing.status || 'draft'} onChange={(e) => setEditing({ ...editing, status: e.target.value, active: e.target.value === 'published' })}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="קישור מקצועי"><input className={fieldClass} dir="ltr" value={editing.professional_url || ''} onChange={(e) => setEditing({ ...editing, professional_url: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm text-white/70 min-h-11">
                <input type="checkbox" className="accent-[#C8A24C]" checked={editing.featured !== false} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                מנחה בוובינר
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => void saveMember()} disabled={saving} className={`${goldBtn} flex-1`}>{saving ? 'שומר...' : 'שמירה'}</button>
              <button type="button" onClick={() => { setEditing(null); setIsNew(false); }} className={ghostBtn}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const goldBtn = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 disabled:opacity-40';
const ghostBtn = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/80 text-sm min-h-11';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`min-h-11 px-4 text-sm ${active ? 'text-[#F7E7B5] border-b-2 border-[#C8A24C]' : 'text-white/50'}`}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 min-h-11">
      <input type="checkbox" className="accent-[#C8A24C]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
