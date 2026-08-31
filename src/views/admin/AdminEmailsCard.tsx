import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import {
  BUILT_IN_ADMIN_EMAILS,
  configuredAdminEmails,
  mergeAdminEmails,
  parseAdminEmails,
  persistExtraAdminEmails,
  setRuntimeAdminEmails,
} from '../../data/adminEmails';
import { fieldClass } from './adminConstants';

export function AdminEmailsCard({ onChanged }: { onChanged?: () => void }) {
  const [emails, setEmails] = useState<string[]>(() => configuredAdminEmails());
  const [builtIn, setBuiltIn] = useState<string[]>([...BUILT_IN_ADMIN_EMAILS]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await adminApi.adminEmails();
      setEmails(data.emails);
      setBuiltIn(data.builtIn);
      persistExtraAdminEmails(data.extra);
      setRuntimeAdminEmails(data.emails);
    } catch {
      setEmails(configuredAdminEmails());
      setBuiltIn([...BUILT_IN_ADMIN_EMAILS]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (merged: string[]) => {
    setPending(true);
    setError('');
    persistExtraAdminEmails(merged);
    setRuntimeAdminEmails(merged);
    try {
      const data = await adminApi.saveAdminEmails(merged);
      setEmails(data.emails);
      persistExtraAdminEmails(data.extra);
    } catch {
      setEmails(configuredAdminEmails());
    } finally {
      setPending(false);
      onChanged?.();
    }
  };

  const add = () => {
    const next = parseAdminEmails(draft);
    if (!next.length) {
      setError('נא להזין אימייל תקין');
      return;
    }
    void save(mergeAdminEmails(emails, next));
    setDraft('');
  };

  return (
    <div className="border border-white/10 rounded-2xl p-6 grid gap-4 bg-white/[0.02]">
      <div>
        <h2 className="text-lg font-light mb-1">מיילים עם הרשאת אדמין</h2>
        <p className="text-sm text-white/50 font-light">
          מי שמתחבר באחד המיילים האלה — באימייל וסיסמה או ב-Google — נכנס כאדמין.
        </p>
      </div>
      <ul className="grid gap-2">
        {emails.map((email) => (
          <li
            key={email}
            className="flex items-center justify-between gap-3 border border-white/10 rounded-xl px-4 py-2 min-h-11 bg-[#0a0a0a]"
          >
            <span className="text-sm text-white" dir="ltr">
              {email}
              {builtIn.includes(email) ? <span className="text-white/35"> · קבוע</span> : null}
            </span>
            {builtIn.includes(email) ? null : (
              <button
                type="button"
                disabled={pending}
                onClick={() => void save(emails.filter((item) => item !== email))}
                className="text-xs text-white/45 hover:text-white min-h-11 px-2 cursor-pointer"
              >
                הסרה
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="block grow">
          <span className="sr-only">אימייל אדמין חדש</span>
          <input
            type="email"
            dir="ltr"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="name@gmail.com"
            className={fieldClass}
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={add}
          className="px-6 py-3 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer disabled:opacity-60"
        >
          {pending ? 'שומר...' : 'הוספה'}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
