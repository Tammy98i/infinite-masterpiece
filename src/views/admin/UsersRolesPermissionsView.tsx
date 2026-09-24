import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi, type AdminUserRow } from '../../api/admin';
import { isApiUnavailableMessage } from '../../lib/supabaseUser';
import { usersFromProfiles, type ProfileListRow } from '../../lib/adminFallback';
import { AdminEmailsCard } from './AdminEmailsCard';
import { AdminPageShell } from './AdminPageShell';
import { TeamMessageComposer } from './TeamMessageComposer';
import { TAB_META } from './adminNav';
import {
  fieldClass,
  PLAN_LABEL,
  ROLE_LABEL,
  STAFF_DESK_LABEL,
  STAFF_DESK_TABS,
} from './adminConstants';
import { Bidi } from '../../components/Bidi';
import { DeskMonogram } from '../../components/DeskMonogram';

export type AccessSection = 'accounts' | 'roles' | 'desks' | 'admins';

const SECTIONS: Array<{ id: AccessSection; label: string; hint: string }> = [
  { id: 'accounts', label: 'חשבונות', hint: 'יצירה, עריכה, מנוי' },
  { id: 'roles', label: 'תפקידים', hint: 'מה כל role רואה' },
  { id: 'desks', label: 'דסקים', hint: 'גישה מוגבלת לצוות' },
  { id: 'admins', label: 'אדמינים', hint: 'מיילי כניסה' },
];

const ROLE_MATRIX = [
  {
    role: 'משתמש (student)',
    library: 'צפייה לפי מנוי',
    admin: '—',
    upload: '—',
    team: '—',
  },
  {
    role: 'מרצה (instructor)',
    library: 'דשבורד מרצה + תכנים שלו',
    admin: '—',
    upload: 'העלאה (באישור)',
    team: '—',
  },
  {
    role: 'אדמין (admin)',
    library: 'גישה מלאה',
    admin: 'לוח בקרה',
    upload: 'ניהול תוכן',
    team: 'לפי דסק',
  },
  {
    role: 'מייסד/ת (is_founder)',
    library: 'פרופיל צוות + נבחרת 88',
    admin: 'כמו אדמין + דגלי מייסד',
    upload: 'כמו מרצה',
    team: 'מופיע/ה בעמוד צוות',
  },
];

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

export function UsersRolesPermissionsView({ initialSection = 'accounts' }: { initialSection?: AccessSection }) {
  const { reloadCatalog, user } = useApp();
  const meta = TAB_META.access;
  const [section, setSection] = useState<AccessSection>(initialSection);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [newIsFounder, setNewIsFounder] = useState(false);

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

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.role.includes(q)
    );
  }, [users, search]);

  const selected = users.find((row) => row.id === selectedId) || null;

  const patch = async (
    id: string,
    next: Parameters<typeof adminApi.updateUser>[1],
    confirmMsg?: string
  ) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const row = users.find((item) => item.id === id);
    if (next.blocked === true && row && !row.blocked && !window.confirm('לחסום את המשתמש?')) return;
    if (next.role && row && next.role !== row.role && !window.confirm('לשנות תפקיד למשתמש?')) return;
    if (
      next.subscriptionPlan === 'none' &&
      row &&
      row.subscriptionPlan !== 'none' &&
      !window.confirm('לבטל מנוי למשתמש?')
    ) {
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
      setDrawerOpen(false);
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
    const header = 'name,email,role,plan,team,blocked,createdAt';
    const rows = users.map((row) =>
      [row.name, row.email, row.role, row.subscriptionPlan, row.isFounder ? '1' : '0', row.blocked ? '1' : '0', row.createdAt]
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
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-xs min-h-10 hover:border-white/40 cursor-pointer transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        רענון
      </button>
      {section === 'accounts' ? (
        <>
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2 rounded-full border border-white/15 text-xs min-h-10 hover:border-white/40 cursor-pointer transition-colors"
          >
            ייצוא
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#b79043] text-black text-xs font-medium min-h-10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            משתמש חדש
          </button>
        </>
      ) : null}
    </>
  );

  return (
    <AdminPageShell group={meta.group} title={meta.title} description={meta.description} actions={headerActions}>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={`px-3 py-1.5 rounded text-xs min-h-9 border cursor-pointer ${
              section === item.id
                ? 'bg-white/10 text-white border-white/30'
                : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === 'accounts' ? (
        <div className="grid gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש משתמש לפי שם…"
            className={fieldClass}
            aria-label="חיפוש משתמש לפי שם"
          />
          <div className="crm-desk-table">
            <table className="w-full text-sm text-start">
              <thead className="text-xs text-white/45 border-b border-white/10">
                <tr>
                  <th className="font-normal">שם</th>
                  <th className="font-normal">תפקיד</th>
                  <th className="font-normal">מנוי</th>
                  <th className="font-normal">סטטוס</th>
                  <th className="font-normal">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((row) => (
                  <tr key={row.id} className={`border-b border-white/5 ${selectedId === row.id ? 'bg-white/10' : ''}`}>
                    <td>
                      <span className="crm-desk-who">
                        <DeskMonogram name={row.name} />
                        <span className="crm-desk-who-text">
                          <span className="crm-desk-who-name">{row.name}</span>
                          <span className="crm-desk-who-mail">
                            <Bidi kind="email">{row.email}</Bidi>
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="text-white/65">{ROLE_LABEL[row.role] || row.role}</td>
                    <td className="text-white/55">{PLAN_LABEL[row.subscriptionPlan] || row.subscriptionPlan}</td>
                    <td>{row.blocked ? 'חסום' : 'פעיל'}</td>
                    <td>
                      <span className="inline-flex gap-1">
                        <button type="button" className="crm-desk-row-act" onClick={() => setSelectedId(row.id === selectedId ? null : row.id)}>
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
                ))}
              </tbody>
            </table>
          </div>

          {selected ? (
            <div className="crm-desk-edit-drawer grid gap-3 text-sm">
              <p className="font-medium">
                עריכה · {selected.name}
                <span className="text-xs text-white/40 ms-2">
                  <Bidi kind="email">{selected.email}</Bidi>
                </span>
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
                  דסק צוות
                  <select
                    value={selected.staffDesk || ''}
                    disabled={pendingId === selected.id}
                    onChange={(e) =>
                      void patch(
                        selected.id,
                        { staffDesk: e.target.value, role: e.target.value ? 'admin' : selected.role },
                        e.target.value ? 'לשייך לדסק צוות?' : undefined
                      )
                    }
                    className={fieldClass}
                  >
                    <option value="">ללא</option>
                    {Object.entries(STAFF_DESK_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
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
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <label className="flex items-center gap-2 text-white/70 text-sm min-h-11">
                  <input
                    type="checkbox"
                    checked={selected.isFounder}
                    disabled={pendingId === selected.id}
                    onChange={() => void patch(selected.id, { isFounder: !selected.isFounder })}
                    className="w-4 h-4 accent-[#b79043]"
                  />
                  שיוך לצוות המיזם
                </label>
                <label className="grid gap-1 text-white/50 text-xs min-w-[10rem]">
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
                <button
                  type="button"
                  disabled={pendingId === selected.id}
                  onClick={() => void patch(selected.id, { blocked: !selected.blocked })}
                  className="crm-desk-row-act"
                >
                  {selected.blocked ? 'שחרור חסימה' : 'חסימה'}
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
              {selected.role === 'instructor' || selected.role === 'admin' ? (
                <TeamMessageComposer
                  lecturerUserId={selected.id}
                  lecturerName={selected.name}
                  disabled={pendingId === selected.id}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {section === 'roles' ? (
        <div className="grid gap-6">
          <p className="text-sm text-white/50 max-w-2xl">
            תפקיד = מה המשתמש יכול לעשות במערכת. דגל מייסד/ת הוא שכבה נוספת — מציג את האדם בעמוד הצוות.
          </p>
          <div className="crm-desk-table">
            <table className="w-full text-sm text-start">
              <thead className="text-xs text-white/45 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-normal">תפקיד</th>
                  <th className="py-3 px-4 font-normal">ספרייה</th>
                  <th className="py-3 px-4 font-normal">אדמין</th>
                  <th className="py-3 px-4 font-normal">העלאה</th>
                  <th className="py-3 px-4 font-normal">צוות</th>
                </tr>
              </thead>
              <tbody>
                {ROLE_MATRIX.map((row, index) => (
                  <tr key={row.role} className={index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}>
                    <td className="py-3 px-4 font-light text-[#dfc47d]/90">{row.role}</td>
                    <td className="py-3 px-4 text-white/55">{row.library}</td>
                    <td className="py-3 px-4 text-white/55">{row.admin}</td>
                    <td className="py-3 px-4 text-white/55">{row.upload}</td>
                    <td className="py-3 px-4 text-white/55">{row.team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {section === 'desks' ? (
        <div className="grid gap-6">
          <p className="text-sm text-white/50 max-w-2xl">
            דסק = תפריט אדמין מצומצם לפי תחום. משתמש עם דסק מקבל תפקיד אדמין אוטומטית.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(STAFF_DESK_LABEL).map(([deskId, label]) => (
              <div key={deskId} className="crm-desk-panel p-4">
                <h3 className="text-base font-light text-[#dfc47d]/90 mb-2">{label}</h3>
                <p className="text-xs text-white/40 mb-3">{STAFF_DESK_TABS[deskId]?.length || 0} לשוניות בלוח</p>
                <ul className="text-xs text-white/55 grid gap-1">
                  {(STAFF_DESK_TABS[deskId] || []).slice(0, 8).map((tabId) => (
                    <li key={tabId}>· {TAB_META[tabId]?.title || tabId}</li>
                  ))}
                  {(STAFF_DESK_TABS[deskId]?.length || 0) > 8 ? <li>· ...</li> : null}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {section === 'admins' ? <AdminEmailsCard onChanged={() => void load()} /> : null}

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-start">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 cursor-pointer"
            aria-label="סגירה"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md h-full crm-desk-panel border-e border-white/10 p-6 overflow-y-auto shadow-2xl rounded-none">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-light">משתמש חדש</h2>
                <p className="text-sm text-white/45 mt-1">יצירת חשבון כניסה + הרשאות ראשוניות</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg border border-white/10 hover:border-white/30 cursor-pointer"
                aria-label="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-4">
              <label className="block">
                <span className="block text-xs text-white/45 mb-1">שם</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className={fieldClass} />
              </label>
              <label className="block">
                <span className="block text-xs text-white/45 mb-1">אימייל</span>
                <input
                  type="email"
                  dir="ltr"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className="block text-xs text-white/45 mb-1">סיסמה (8+)</span>
                <input
                  type="password"
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="grid gap-1 text-white/50">
                תפקיד
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as typeof newRole)}
                  className={fieldClass}
                >
                  <option value="student">משתמש</option>
                  <option value="instructor">מרצה</option>
                  <option value="admin">אדמין</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={newIsFounder}
                  onChange={(e) => setNewIsFounder(e.target.checked)}
                  className="w-4 h-4 accent-[#b79043]"
                />
                שיוך לצוות המיזם
              </label>
              <button
                type="button"
                disabled={creating}
                onClick={() => void createUser()}
                className="w-full py-3 rounded-full bg-[#b79043] text-black text-sm font-medium min-h-11 cursor-pointer disabled:opacity-60"
              >
                {creating ? 'יוצר...' : 'יצירת חשבון'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
