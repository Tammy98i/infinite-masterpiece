import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, type AdminUserRow } from '../../api/admin';
import { AdminPageShell } from './AdminPageShell';
import { TeamMessageComposer } from './TeamMessageComposer';
import { TAB_META } from './adminNav';
import { fieldClass, STAFF_DESK_LABEL } from './adminConstants';
import { AdminListControls } from './AdminListControls';
import { AdminStatusBadge } from './AdminStatusBadge';

type StaffFilter = 'all' | 'lecturer' | 'staff' | 'founder';

export function TeamStaffView() {
  const meta = TAB_META.team;
  const { reloadCatalog } = useApp();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StaffFilter>('all');
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = () =>
    adminApi
      .users()
      .then((res) => setUsers(res.users))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => users.filter((row) => {
    const normalized = query.trim().toLowerCase();
    const matchesQuery = !normalized || `${row.name} ${row.email} ${row.staffDesk || ''}`.toLowerCase().includes(normalized);
    if (!matchesQuery) return false;
    const isStaff = row.role === 'admin' || Boolean(row.staffDesk);
    const isLecturer = row.role === 'instructor';
    if (filter === 'lecturer') return isLecturer;
    if (filter === 'staff') return isStaff;
    if (filter === 'founder') return Boolean(row.isFounder);
    return isStaff || isLecturer || Boolean(row.isFounder);
  }), [users, filter, query]);

  const selected = users.find((row) => row.id === selectedId) || null;

  const patch = async (id: string, next: Parameters<typeof adminApi.updateUser>[1], confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setPendingId(id);
    setError('');
    try {
      await adminApi.updateUser(id, next);
      await load();
      if (next.role === 'instructor' || next.isFounder !== undefined) await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הפעולה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  const headerActions = (
    <button
      type="button"
      onClick={() => void load()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-xs min-h-10 hover:border-white/40 cursor-pointer transition-colors"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      רענון
    </button>
  );

  return (
    <AdminPageShell group={meta.group} title={meta.title} description={meta.description} actions={headerActions}>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <AdminListControls query={query} onQueryChange={setQuery} placeholder="חיפוש איש צוות, מרצה או דסק…" count={rows.length} total={users.filter(row => row.role === 'admin' || row.role === 'instructor' || Boolean(row.staffDesk) || Boolean(row.isFounder)).length}>
        <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', 'הכל'],
            ['lecturer', 'מרצים'],
            ['staff', 'צוות'],
            ['founder', 'מייסדים'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-xl text-xs min-h-10 border cursor-pointer transition-colors ${
              filter === id
                ? 'bg-[#b79043]/15 text-[#dfc47d] border-[#b79043]/40'
                : 'border-white/10 text-white/55 hover:border-white/25'
            }`}
          >
            {label}
          </button>
        ))}
        </div>
      </AdminListControls>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="overflow-x-auto border border-white/10 rounded-2xl bg-white/[0.02]">
          <table className="w-full text-sm text-start">
            <thead className="text-xs text-white/45 border-b border-white/10 bg-[#0a0a0a]">
              <tr>
                <th className="py-3 px-3 font-normal">שם</th>
                <th className="py-3 px-3 font-normal">תפקיד</th>
                <th className="py-3 px-3 font-normal">דסק</th>
                <th className="py-3 px-3 font-normal">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 px-3 text-white/40">
                    אין רשומות בסינון הנוכחי.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`cursor-pointer border-b border-white/5 ${
                      selectedId === row.id ? 'bg-[#b79043]/10' : index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                    } hover:bg-[#b79043]/5 transition-colors`}
                  >
                    <td className="py-3 px-3">
                      {row.name}
                      {row.isFounder ? <span className="text-white/35"> · מייסד</span> : null}
                      <span className="block text-xs text-white/35" dir="ltr">
                        {row.email}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white/60">{row.role === 'admin' ? 'אדמין' : row.role === 'instructor' ? 'מרצה' : 'משתמש'}</td>
                    <td className="py-3 px-3 text-white/55">{row.staffDesk ? STAFF_DESK_LABEL[row.staffDesk] || row.staffDesk : '—'}</td>
                    <td className="py-3 px-3 text-white/55">
                      <AdminStatusBadge tone={row.blocked || row.staffStatus === 'suspended' ? 'danger' : row.staffStatus === 'limited' ? 'warning' : 'success'}>
                        {row.blocked ? 'חסום' : row.staffStatus === 'suspended' ? 'מושהה' : row.staffStatus === 'limited' ? 'מוגבל' : 'פעיל'}
                      </AdminStatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="border border-white/10 rounded-2xl p-5 min-h-[360px] bg-white/[0.02]">
          {!selected ? (
            <p className="text-sm text-white/45">בחרו איש צוות או מרצה.</p>
          ) : (
            <div className="grid gap-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#b79043] mb-2">כרטיס צוות</p>
                <h3 className="text-xl font-light">{selected.name}</h3>
                <p className="text-white/45 mt-1 break-all text-xs" dir="ltr">
                  {selected.email}
                </p>
              </div>

              <label className="grid gap-1 text-white/50">
                תפקיד מערכת
                <select
                  value={selected.role}
                  disabled={pendingId === selected.id}
                  onChange={(e) => void patch(selected.id, { role: e.target.value }, 'לשנות תפקיד למשתמש?')}
                  className={fieldClass}
                >
                  <option value="student">משתמש</option>
                  <option value="instructor">מרצה</option>
                  <option value="admin">אדמין / צוות</option>
                </select>
              </label>

              <label className="grid gap-1 text-white/50">
                דסק צוות
                <select
                  value={selected.staffDesk || ''}
                  disabled={pendingId === selected.id}
                  onChange={(e) =>
                    void patch(
                      selected.id,
                      { staffDesk: e.target.value, role: e.target.value ? 'admin' : selected.role },
                      e.target.value ? 'לשייך לדסק צוות? המשתמש יקבל גישה מוגבלת לאדמין.' : undefined
                    )
                  }
                  className={fieldClass}
                >
                  <option value="">ללא (סופר אדמין אם תפקיד אדמין)</option>
                  {Object.entries(STAFF_DESK_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-white/50">
                סטטוס גישה
                <select
                  value={selected.staffStatus || 'active'}
                  disabled={pendingId === selected.id}
                  onChange={(e) =>
                    void patch(
                      selected.id,
                      { staffStatus: e.target.value },
                      e.target.value === 'suspended' ? 'להשהות גישה ולנתק סשנים פעילים?' : undefined
                    )
                  }
                  className={fieldClass}
                >
                  <option value="active">פעיל</option>
                  <option value="limited">גישה מוגבלת</option>
                  <option value="suspended">מושהה</option>
                </select>
              </label>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={pendingId === selected.id}
                  onClick={() =>
                    void patch(selected.id, { blocked: !selected.blocked }, selected.blocked ? undefined : 'לחסום ולנתק סשנים?')
                  }
                  className="px-3 py-2 text-xs border border-white/20 rounded-xl min-h-10 cursor-pointer"
                >
                  {selected.blocked ? 'שחרור חסימה' : 'חסימה'}
                </button>
                <button
                  type="button"
                  disabled={pendingId === selected.id}
                  onClick={() =>
                    void patch(
                      selected.id,
                      { isFounder: !selected.isFounder },
                      selected.isFounder ? 'להסיר דגל מייסד?' : 'לסמן כמייסד?'
                    )
                  }
                  className="px-3 py-2 text-xs border border-[#b79043]/40 text-[#b79043] rounded-xl min-h-10 cursor-pointer"
                >
                  {selected.isFounder ? 'הסרת מייסד' : 'סימון מייסד'}
                </button>
                {selected.role !== 'instructor' ? (
                  <button
                    type="button"
                    disabled={pendingId === selected.id}
                    onClick={() => void patch(selected.id, { role: 'instructor' }, 'לאשר כמרצה?')}
                    className="px-3 py-2 text-xs bg-[#b79043] text-black rounded-xl min-h-10 cursor-pointer"
                  >
                    אישור כמרצה
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pendingId === selected.id}
                    onClick={() => void patch(selected.id, { role: 'student', staffDesk: '' }, 'להסיר תפקיד מרצה?')}
                    className="px-3 py-2 text-xs border border-white/20 rounded-xl min-h-10 cursor-pointer"
                  >
                    הסרת תפקיד מרצה
                  </button>
                )}
              </div>

              {selected.role === 'instructor' || selected.role === 'admin' ? (
                <TeamMessageComposer
                  lecturerUserId={selected.id}
                  lecturerName={selected.name}
                  disabled={pendingId === selected.id}
                />
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </AdminPageShell>
  );
}
