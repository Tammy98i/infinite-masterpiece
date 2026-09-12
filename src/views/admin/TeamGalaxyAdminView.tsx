import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, X, Star } from 'lucide-react';
import { teamMembersApi, type TeamMember } from '../../api/teamMembers';
import { FileUploadField } from '../../components/FileUploadField';
import { fieldClass } from './adminConstants';

const HIERARCHY_LEVELS = [
  { value: 'founder', label: 'Founder' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'core', label: 'Core Team' },
  { value: 'contributor', label: 'Contributor' },
];

const EMPTY_FORM: Partial<TeamMember> = {
  name: '',
  role: '',
  photo: '',
  bio: '',
  contribution: '',
  responsibilities: [],
  expertise: [],
  impact_score: 50,
  hierarchy_level: 'contributor',
  orbit: 3,
  active: true,
  display_order: 0,
};

export function TeamGalaxyAdminView() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<TeamMember> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teamMembersApi.adminList();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינה נכשלה');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startNew = () => {
    setEditing({ ...EMPTY_FORM });
    setIsNew(true);
  };

  const startEdit = (m: TeamMember) => {
    setEditing({ ...m });
    setIsNew(false);
  };

  const cancel = () => {
    setEditing(null);
    setIsNew(false);
  };

  const save = async () => {
    if (!editing || !editing.name?.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await teamMembersApi.adminCreate(editing);
      } else if (editing.id) {
        await teamMembersApi.adminUpdate(editing.id, editing);
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

  const remove = async (id: string) => {
    if (!confirm('למחוק את איש הצוות?')) return;
    try {
      await teamMembersApi.adminDelete(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'מחיקה נכשלה');
    }
  };

  const toggleActive = async (m: TeamMember) => {
    try {
      await teamMembersApi.adminUpdate(m.id, { active: !m.active });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'עדכון נכשל');
    }
  };

  if (loading) {
    return <div className="text-white/50 text-sm p-8 text-center">טוען...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-white font-medium">גלקסיית הצוות</h2>
          <p className="text-sm text-white/40">נהלו אנשי צוות, Impact Score ומיקומים בגלקסיה</p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C8A24C] text-black text-sm font-medium hover:bg-[#D4AF37] transition-colors min-h-11"
        >
          <Plus className="w-4 h-4" />
          הוספת איש צוות
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 gap-2">
        {members.map((m) => (
          <div
            key={m.id}
          className={`flex items-center gap-4 p-4 rounded-xl border ${m.active ? 'border-white/10 bg-white/[0.02]' : 'border-white/5 bg-white/[0.01] opacity-50'}`}
          >
            <div
              className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#C8A24C]/30"
              style={{ boxShadow: m.hierarchy_level === 'founder' ? '0 0 12px rgba(244,208,63,0.3)' : 'none' }}
            >
              {m.photo ? (
                <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0b1020] text-[#F7E7B5] text-sm font-medium">
                  {m.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{m.name}</p>
              <p className="text-white/40 text-xs truncate">{m.role}</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#C8A24C] shrink-0">
              <Star className="w-3 h-3" />
              {m.impact_score}
            </div>
            <span className="text-xs text-white/30 shrink-0 hidden sm:inline">
              Orbit {m.orbit}
            </span>

            <button
              type="button"
              onClick={() => toggleActive(m)}
              className={`text-xs px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
                m.active
                  ? 'border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40'
                  : 'border-white/10 text-white/40 hover:border-white/20'
              }`}
            >
              {m.active ? 'פעיל' : 'מוסתר'}
            </button>
            <button
              type="button"
              onClick={() => startEdit(m)}
              className="text-xs text-[#C8A24C] hover:text-[#F7E7B5] shrink-0 min-h-11 px-2"
            >
              עריכה
            </button>
            <button
              type="button"
              onClick={() => remove(m.id)}
              className="text-rose-400/60 hover:text-rose-400 shrink-0 min-h-11 px-2"
              aria-label="מחיקה"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Edit / New modal */}
      {editing && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={cancel}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#C8A24C]/20 bg-[#0a0a0a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={cancel}
              className="absolute top-4 left-4 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white"
              aria-label="סגירה"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg text-white font-medium mb-4">
              {isNew ? 'איש צוות חדש' : 'עריכת איש צוות'}
            </h3>

            <div className="space-y-3 text-right">
              <FormField label="שם">
                <input
                  className={fieldClass}
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </FormField>

              <FormField label="תפקיד">
                <input
                  className={fieldClass}
                  value={editing.role || ''}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                />
              </FormField>

              <FormField label="תמונה">
                <FileUploadField
                  kind="image"
                  label="העלאת תמונה"
                  value={editing.photo || ''}
                  onChange={(url) => setEditing({ ...editing, photo: url })}
                  previewAlt={editing.name}
                />
              </FormField>

              <FormField label="מי אני (Bio)">
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={editing.bio || ''}
                  onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                />
              </FormField>

              <FormField label="התרומה למיזם">
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={editing.contribution || ''}
                  onChange={(e) => setEditing({ ...editing, contribution: e.target.value })}
                />
              </FormField>

              <FormField label="תחומי אחריות (מופרדים בפסיק)">
                <input
                  className={fieldClass}
                  value={(editing.responsibilities || []).join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      responsibilities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </FormField>

              <FormField label="תחומי מומחיות (מופרדים בפסיק)">
                <input
                  className={fieldClass}
                  value={(editing.expertise || []).join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      expertise: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Impact Score (0-100)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={fieldClass}
                    value={editing.impact_score ?? 50}
                    onChange={(e) => setEditing({ ...editing, impact_score: Number(e.target.value) })}
                  />
                </FormField>

                <FormField label="רמת היררכיה">
                  <select
                    className={fieldClass}
                    value={editing.hierarchy_level || 'contributor'}
                    onChange={(e) => setEditing({ ...editing, hierarchy_level: e.target.value })}
                  >
                    {HIERARCHY_LEVELS.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Orbit (0-3)">
                  <input
                    type="number"
                    min={0}
                    max={3}
                    className={fieldClass}
                    value={editing.orbit ?? 3}
                    onChange={(e) => setEditing({ ...editing, orbit: Number(e.target.value) })}
                  />
                </FormField>

                <FormField label="סדר תצוגה">
                  <input
                    type="number"
                    min={0}
                    className={fieldClass}
                    value={editing.display_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })}
                  />
                </FormField>
              </div>

              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.active !== false}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="accent-[#C8A24C]"
                />
                פעיל (מוצג בגלקסיה)
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={save}
                disabled={saving || !editing.name?.trim()}
                className="flex-1 py-2.5 rounded-full bg-[#C8A24C] text-black text-sm font-medium hover:bg-[#D4AF37] transition-colors disabled:opacity-40 min-h-11"
              >
                {saving ? 'שומר...' : 'שמירה'}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="px-6 py-2.5 rounded-full border border-white/10 text-white/60 text-sm hover:text-white transition-colors min-h-11"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
