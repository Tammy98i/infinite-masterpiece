import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, type AdminUserRow } from '../../api/admin';
import { isApiUnavailableMessage } from '../../lib/supabaseUser';
import { usersFromProfiles, type ProfileListRow } from '../../lib/adminFallback';
import { AdminEmailsCard } from './AdminEmailsCard';
import { AdminPageShell } from './AdminPageShell';
import { TAB_META } from './adminNav';
import { fieldClass, PLAN_LABEL, ROLE_LABEL } from './adminConstants';

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

  const headerActions = (
    <>
      <button
        type="button"
        onClick={() => void load()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-xs min-h-10 hover:border-white/40 cursor-pointer transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        רענון
      </button>
      <button
        type="button"
        onClick={exportCsv}
        className="px-4 py-2 rounded-full border border-white/15 text-xs min-h-10 hover:border-white/40 cursor-pointer transition-colors"
      >
        ייצוא
      </button>
    </>
  );

  return (
    <AdminPageShell group={meta.group} title={meta.title} description={meta.description} actions={headerActions}>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <AdminEmailsCard onChanged={() => void load()} />

      <div className="border border-white/10 rounded-2xl p-5 grid gap-4 bg-white/[0.02]">
        <div>
          <h2 className="text-lg font-light mb-1">הוספת משתמש</h2>
          <p className="text-sm text-white/45 font-light">יצירת חשבון כניסה + תפקיד ושיוך לצוות.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="grid gap-1 text-white/50">
            תפקיד
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as typeof newRole)} className={fieldClass}>
              <option value="student">משתמש</option>
              <option value="instructor">מרצה</option>
              <option value="admin">אדמין</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm text-white/70 min-h-11 pt-5">
            <input type="checkbox" checked={newIsFounder} onChange={(e) => setNewIsFounder(e.target.checked)} className="w-4 h-4 accent-[#C8A24C]" />
            שיוך לצוות המיזם
          </label>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={() => void createUser()}
          className="inline-flex items-center gap-2 w-full sm:w-auto px-6 py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'יוצר...' : 'יצירת חשבון'}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.85fr]">
        <div className="overflow-x-auto border border-white/10 rounded-2xl bg-white/[0.02]">
          <table className="w-full text-sm text-right">
            <thead className="text-xs text-white/45 border-b border-white/10 bg-[#0a0a0a]">
              <tr>
                <th className="py-3 px-3 font-normal">שם</th>
                <th className="py-3 px-3 font-normal">תפקיד</th>
                <th className="py-3 px-3 font-normal">מנוי</th>
                <th className="py-3 px-3 font-normal">מסלול</th>
                <th className="py-3 px-3 font-normal">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row, index) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedId(row.id)}
                  className={`cursor-pointer border-b border-white/5 ${
                    selectedId === row.id ? 'bg-[#C8A24C]/10' : index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                  } hover:bg-[#C8A24C]/5 transition-colors`}
                >
                  <td className="py-3 px-3">
                    <span className="block">{row.name}</span>
                    <span className="block text-xs text-white/35 truncate max-w-[180px]" dir="ltr">
                      {row.email}
                    </span>
                    {row.isFounder ? <span className="text-[10px] text-[#C8A24C]/80">צוות</span> : null}
                  </td>
                  <td className="py-3 px-3 text-white/65">{ROLE_LABEL[row.role] || row.role}</td>
                  <td className="py-3 px-3 text-white/55">{PLAN_LABEL[row.subscriptionPlan] || row.subscriptionPlan}</td>
                  <td className="py-3 px-3 text-white/55">
                    {row.entryTrack === 'brave' ? 'אמיצים' : row.entryTrack === 'hesitant' ? 'הססנים' : 'ללא'}
                  </td>
                  <td className="py-3 px-3">{row.blocked ? 'חסום' : 'פעיל'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="border border-white/10 rounded-2xl p-5 min-h-[360px] bg-white/[0.02]">
          {!selected ? (
            <p className="text-sm text-white/45">בחרו משתמש מהטבלה.</p>
          ) : (
            <div className="grid gap-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A24C] mb-2">כרטיס משתמש</p>
                <h3 className="text-xl font-light">{selected.name}</h3>
                <p className="text-white/45 mt-1 break-all text-xs" dir="ltr">
                  {selected.email}
                </p>
              </div>
              <div className="text-xs text-white/45 grid gap-1">
                <p>פעימה: {selected.currentPaymentPhase || 0}</p>
                <p>כרטיסי הגרלה: {selected.raffleTicketsCount || 0}</p>
                <p>הצטרפות: {selected.createdAt.replace('T', ' ').slice(0, 16)}</p>
                <p>כניסה אחרונה: {selected.lastLoginAt?.replace('T', ' ').slice(0, 16) || 'אין'}</p>
              </div>

              <label className="grid gap-1 text-white/50">
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
              <label className="grid gap-1 text-white/50">
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
              <label className="grid gap-1 text-white/50">
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
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={pendingId === selected.id}
                  onClick={() => void patch(selected.id, { blocked: !selected.blocked })}
                  className="px-3 py-2 text-xs border border-white/20 rounded-xl min-h-10 cursor-pointer"
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
                  className="px-3 py-2 text-xs border border-[#C8A24C]/40 text-[#C8A24C] rounded-xl min-h-10 cursor-pointer"
                >
                  {selected.isFounder ? 'הסרה מהצוות' : 'שיוך לצוות'}
                </button>
                {selected.role !== 'instructor' && selected.role !== 'admin' ? (
                  <button
                    type="button"
                    disabled={pendingId === selected.id}
                    onClick={() => void patch(selected.id, { role: 'instructor' })}
                    className="px-3 py-2 text-xs bg-[#C8A24C] text-black rounded-xl min-h-10 cursor-pointer"
                  >
                    אישור כמרצה
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </aside>
      </div>
    </AdminPageShell>
  );
}
