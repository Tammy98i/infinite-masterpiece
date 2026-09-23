import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, type AdminUserRow } from '../../api/admin';
import { isApiUnavailableMessage } from '../../lib/supabaseUser';
import { usersFromProfiles, type ProfileListRow } from '../../lib/adminFallback';
import { AdminEmailsCard } from './AdminEmailsCard';
import { AdminPageShell } from './AdminPageShell';
import { TAB_META } from './adminNav';
import { fieldClass, PLAN_LABEL, ROLE_LABEL } from './adminConstants';
import { AdminListControls } from './AdminListControls';
import { AdminStatusBadge } from './AdminStatusBadge';

function profileRowFromAppUser(user: ReturnType<typeof useApp>['user']): ProfileListRow {
  return {
    id: user.id,
    email: user.email,
    full_name: user.name,
    role: user.role === 'admin' ? 'admin' : user.role === 'instructor' ? 'lecturer' : 'user',
    subscription_plan: user.subscriptionPlan,
    is_founder: Boolean(user.isFounder),
    staff_desk: user.staffDesk || '',
    staff_status: user.staffStatus || 'active',
  };
}

export function UsersAccountsView() {
  const meta = TAB_META.users;
  const { reloadCatalog, user } = useApp();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [newIsFounder, setNewIsFounder] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () =>
    adminApi
      .users()
      .then((res) => setUsers(res.users))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'טעינה נכשלה';
        if (isApiUnavailableMessage(message) && user.id !== 'guest') {
          setUsers(usersFromProfiles([profileRowFromAppUser(user)]));
          return;
        }
        setError(message);
      });

  useEffect(() => {
    void load();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((row) => {
      const matchesQuery = !normalized || `${row.name} ${row.email}`.toLowerCase().includes(normalized);
      const matchesRole = roleFilter === 'all' || row.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'blocked' ? row.blocked : !row.blocked);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const selected = users.find((row) => row.id === selectedId) || null;

  const patch = async (id: string, next: Parameters<typeof adminApi.updateUser>[1]) => {
    const row = users.find((item) => item.id === id);
    if (next.blocked === true && row && !row.blocked && !window.confirm('לחסום את המשתמש?')) return;
    if (next.role && row && next.role !== row.role && !window.confirm('לשנות תפקיד למשתמש?')) return;
    if (next.subscriptionPlan === 'none' && row && row.subscriptionPlan !== 'none' && !window.confirm('לבטל מנוי?')) {
      return;
    }
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

  const createUser = async () => {
    if (!newName.trim() || !newEmail.trim() || newPassword.length < 8) {
      setError('יש להזין שם, אימייל וסיסמה בת 8 תווים לפחות.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const created = await adminApi.createUser({
        fullName: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        isFounder: newIsFounder,
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('student');
      setNewIsFounder(false);
      setCreateOpen(false);
      await load();
      setSelectedId(created.user.id);
      if (newRole === 'instructor' || newIsFounder) await reloadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירה נכשלה');
    } finally {
      setCreating(false);
    }
  };

  const exportCsv = () => {
    const header = 'name,email,role,plan,track,team,blocked,createdAt';
    const rows = users.map((row) =>
      [
        row.name,
        row.email,
        row.role,
        row.subscriptionPlan,
        row.entryTrack || 'none',
        row.isFounder ? '1' : '0',
        row.blocked ? '1' : '0',
        row.createdAt,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([`\uFEFF${header}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const removeUser = async (id: string, name: string) => {
    if (!window.confirm(`להסיר את ${name}? החשבון יימחק. חסימה נשארת פעולה נפרדת.`)) return;
    setPendingId(id);
    setError('');
    try {
      await adminApi.deleteUser(id);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההסרה נכשלה');
    } finally {
      setPendingId(null);
    }
  };

  const headerActions = (
    <>
      <button
        type="button"
        onClick={() => void load()}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/15 text-xs min-h-9 hover:border-white/40 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        רענון
      </button>
      <button
        type="button"
        onClick={exportCsv}
        className="px-3 py-1.5 rounded border border-white/15 text-xs min-h-9 hover:border-white/40 cursor-pointer"
      >
        ייצוא
      </button>
      <button
        type="button"
        onClick={() => setCreateOpen((open) => !open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white text-black text-xs font-medium min-h-9 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        הוספת משתמש
      </button>
    </>
  );

  return (
    <AdminPageShell group={meta.group} title={meta.title} description={meta.description} actions={headerActions}>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <AdminEmailsCard onChanged={() => void load()} />

      {createOpen ? (
        <div className="crm-desk-edit-drawer grid gap-3">
          <p className="text-sm font-medium">חשבון חדש</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="block">
              <span className="block text-xs text-white/45 mb-1">שם</span>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className={fieldClass} />
            </label>
            <label className="block">
              <span className="block text-xs text-white/45 mb-1">אימייל</span>
              <input type="email" dir="ltr" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={fieldClass} />
            </label>
            <label className="block">
              <span className="block text-xs text-white/45 mb-1">סיסמה (8+)</span>
              <input type="password" dir="ltr" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={fieldClass} />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="grid gap-1 text-white/50 text-xs">
              תפקיד
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as typeof newRole)} className={fieldClass}>
                <option value="student">משתמש</option>
                <option value="instructor">מרצה</option>
                <option value="admin">אדמין</option>
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm text-white/70 min-h-11">
              <input type="checkbox" checked={newIsFounder} onChange={(e) => setNewIsFounder(e.target.checked)} className="w-4 h-4 accent-[#b79043]" />
              שיוך לצוות המיזם
            </label>
          </div>
          <button
            type="button"
            disabled={creating}
            onClick={() => void createUser()}
            className="inline-flex items-center gap-2 w-full sm:w-auto px-4 py-2 rounded bg-white text-black text-sm font-medium min-h-11 cursor-pointer disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'יוצר...' : 'יצירת חשבון'}
          </button>
        </div>
      ) : null}

      <AdminListControls query={query} onQueryChange={setQuery} placeholder="חיפוש משתמש לפי שם…" count={filteredUsers.length} total={users.length}>
        <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="min-h-11 rounded border border-white/10 bg-[#0a0a0a] px-3 text-sm text-white/70" aria-label="סינון לפי תפקיד">
          <option value="all">כל התפקידים</option><option value="student">משתמשים</option><option value="instructor">מרצים</option><option value="admin">אדמינים</option>
        </select>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="min-h-11 rounded border border-white/10 bg-[#0a0a0a] px-3 text-sm text-white/70" aria-label="סינון לפי סטטוס">
          <option value="all">כל הסטטוסים</option><option value="active">פעילים</option><option value="blocked">חסומים</option>
        </select>
      </AdminListControls>

      <div className="overflow-x-auto border border-white/10 rounded bg-white/[0.02]">
        <table className="w-full text-sm text-start">
          <thead className="text-xs text-white/45 border-b border-white/10">
            <tr>
              <th className="font-normal">שם</th>
              <th className="font-normal">תפקיד</th>
              <th className="font-normal">מנוי</th>
              <th className="font-normal">מסלול</th>
              <th className="font-normal">סטטוס</th>
              <th className="font-normal">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-white/40">
                  לא נמצאו משתמשים לפי הסינון הנוכחי.
                </td>
              </tr>
            ) : (
              filteredUsers.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-white/5 ${selectedId === row.id ? 'bg-white/10' : ''}`}
                >
                  <td>
                    <span>{row.name}</span>
                    <span className="text-xs text-white/35 ms-2" dir="ltr">
                      {row.email}
                    </span>
                    {row.isFounder ? <span className="text-[10px] text-white/45 ms-2">צוות</span> : null}
                  </td>
                  <td className="text-white/65">{ROLE_LABEL[row.role] || row.role}</td>
                  <td className="text-white/55">{PLAN_LABEL[row.subscriptionPlan] || row.subscriptionPlan}</td>
                  <td className="text-white/55">
                    {row.entryTrack === 'brave' ? 'אמיצים' : row.entryTrack === 'hesitant' ? 'הססנים' : 'ללא'}
                  </td>
                  <td>
                    <AdminStatusBadge tone={row.blocked ? 'danger' : 'success'}>{row.blocked ? 'חסום' : 'פעיל'}</AdminStatusBadge>
                  </td>
                  <td>
                    <span className="inline-flex gap-1">
                      <button
                        type="button"
                        className="crm-desk-row-act"
                        onClick={() => setSelectedId(row.id === selectedId ? null : row.id)}
                      >
                        עריכה
                      </button>
                      <button
                        type="button"
                        className="crm-desk-row-act kill"
                        disabled={pendingId === row.id}
                        onClick={() => void removeUser(row.id, row.name)}
                      >
                        הסרה
                      </button>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="crm-desk-edit-drawer grid gap-3 text-sm">
          <p className="text-sm font-medium">
            עריכה · {selected.name}
            <span className="text-xs text-white/40 ms-2" dir="ltr">
              {selected.email}
            </span>
          </p>
          <p className="text-xs text-white/40">
            פעימה {selected.currentPaymentPhase || 0} · כרטיסים {selected.raffleTicketsCount || 0} · הצטרפות{' '}
            {selected.createdAt.replace('T', ' ').slice(0, 16)}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="grid gap-1 text-white/50 text-xs">
              תפקיד
              <select
                value={selected.role}
                disabled={pendingId === selected.id}
                onChange={(e) => void patch(selected.id, { role: e.target.value })}
                className={fieldClass}
              >
                <option value="student">משתמש</option>
                <option value="instructor">מרצה</option>
                <option value="admin">אדמין</option>
              </select>
            </label>
            <label className="grid gap-1 text-white/50 text-xs">
              מנוי
              <select
                value={selected.subscriptionPlan}
                disabled={pendingId === selected.id}
                onChange={(e) => void patch(selected.id, { subscriptionPlan: e.target.value })}
                className={fieldClass}
              >
                {Object.entries(PLAN_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-white/50 text-xs">
              מסלול כניסה
              <select
                value={selected.entryTrack || 'none'}
                disabled={pendingId === selected.id}
                onChange={(e) =>
                  void patch(selected.id, {
                    entryTrack: e.target.value,
                    currentPaymentPhase: e.target.value === 'brave' ? 1 : selected.currentPaymentPhase || 0,
                  })
                }
                className={fieldClass}
              >
                <option value="none">ללא</option>
                <option value="brave">אמיצים</option>
                <option value="hesitant">הססנים</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pendingId === selected.id}
              onClick={() => void patch(selected.id, { blocked: !selected.blocked })}
              className="crm-desk-row-act"
            >
              {selected.blocked ? 'שחרור חסימה' : 'חסימה'}
            </button>
            <button
              type="button"
              disabled={pendingId === selected.id}
              onClick={() => {
                if (!window.confirm(selected.isFounder ? 'להסיר מצוות המיזם?' : 'לשייך לצוות המיזם?')) return;
                void patch(selected.id, { isFounder: !selected.isFounder });
              }}
              className="crm-desk-row-act"
            >
              {selected.isFounder ? 'הסרה מהצוות' : 'שיוך לצוות'}
            </button>
            {selected.role !== 'instructor' && selected.role !== 'admin' ? (
              <button
                type="button"
                disabled={pendingId === selected.id}
                onClick={() => void patch(selected.id, { role: 'instructor' })}
                className="crm-desk-row-act"
              >
                אישור כמרצה
              </button>
            ) : null}
            <button type="button" className="crm-desk-row-act" onClick={() => setSelectedId(null)}>
              סגירה
            </button>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
