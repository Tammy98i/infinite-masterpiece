import { fieldClass, PLAN_LABEL, STAFF_DESK_LABEL } from './adminConstants';

export type AccountRole = 'student' | 'instructor' | 'admin';

export type UserDraft = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthday: string;
  phone: string;
  city: string;
  role: AccountRole;
  isFounder: boolean;
  subscriptionPlan: string;
  entryTrack: string;
  staffDesk: string;
};

export const emptyUserDraft = (): UserDraft => ({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  birthday: '',
  phone: '',
  city: '',
  role: 'student',
  isFounder: false,
  subscriptionPlan: 'none',
  entryTrack: 'none',
  staffDesk: '',
});

export function showBirthday(value: string) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}.${month}.${year}` : value;
}

export function UserProfileFields({
  value,
  onChange,
  showAccount = true,
  showPassword = false,
}: {
  value: UserDraft;
  onChange: (next: UserDraft) => void;
  showAccount?: boolean;
  showPassword?: boolean;
}) {
  const set = <K extends keyof UserDraft>(key: K, next: UserDraft[K]) => {
    const draft = { ...value, [key]: next };
    if (key === 'role' && next !== 'admin') draft.staffDesk = '';
    onChange(draft);
  };

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">שם פרטי</span>
          <input value={value.firstName} onChange={(event) => set('firstName', event.target.value)} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">שם משפחה</span>
          <input value={value.lastName} onChange={(event) => set('lastName', event.target.value)} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">יום הולדת</span>
          <input type="date" dir="ltr" value={value.birthday} onChange={(event) => set('birthday', event.target.value)} className={fieldClass} />
        </label>
        <label className="block">
          <span className="block text-xs text-white/45 mb-1">טלפון</span>
          <input type="tel" dir="ltr" value={value.phone} onChange={(event) => set('phone', event.target.value)} className={fieldClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-xs text-white/45 mb-1">עיר</span>
          <input value={value.city} onChange={(event) => set('city', event.target.value)} className={fieldClass} />
        </label>
      </div>

      {showAccount ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-xs text-white/45 mb-1">אימייל</span>
            <input type="email" dir="ltr" value={value.email} onChange={(event) => set('email', event.target.value)} className={fieldClass} />
          </label>
          {showPassword ? (
            <label className="block">
              <span className="block text-xs text-white/45 mb-1">סיסמה (8+)</span>
              <input type="password" dir="ltr" value={value.password} onChange={(event) => set('password', event.target.value)} className={fieldClass} />
            </label>
          ) : null}
          <label className="grid gap-1 text-white/50 text-xs">
            תפקיד
            <select value={value.role} onChange={(event) => set('role', event.target.value as AccountRole)} className={fieldClass}>
              <option value="student">משתמש</option>
              <option value="instructor">מרצה</option>
              <option value="admin">אדמין</option>
            </select>
          </label>
          <label className="grid gap-1 text-white/50 text-xs">
            מנוי ספרייה
            <select value={value.subscriptionPlan} onChange={(event) => set('subscriptionPlan', event.target.value)} className={fieldClass}>
              {Object.entries(PLAN_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-white/50 text-xs">
            מסלול כניסה
            <select value={value.entryTrack} onChange={(event) => set('entryTrack', event.target.value)} className={fieldClass}>
              <option value="none">ללא</option>
              <option value="brave">אמיצים</option>
              <option value="hesitant">הססנים</option>
            </select>
          </label>
          {value.role === 'admin' ? (
            <label className="grid gap-1 text-white/50 text-xs">
              דסק צוות
              <select value={value.staffDesk} onChange={(event) => set('staffDesk', event.target.value)} className={fieldClass}>
                <option value="">מנהלת מערכת</option>
                {Object.entries(STAFF_DESK_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex items-center gap-3 text-sm text-white/70 min-h-11">
            <input type="checkbox" checked={value.isFounder} onChange={(event) => set('isFounder', event.target.checked)} className="w-4 h-4 accent-[#b79043]" />
            שיוך לצוות המיזם
          </label>
        </div>
      ) : null}
    </div>
  );
}
