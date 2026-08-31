import { useState } from 'react';
import { adminApi } from '../../api/admin';
import { fieldClass } from './adminConstants';

export function TeamMessageComposer({
  lecturerUserId,
  lecturerName,
  disabled,
}: {
  lecturerUserId: string;
  lecturerName: string;
  disabled?: boolean;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const send = async () => {
    setPending(true);
    setError('');
    setOk('');
    try {
      await adminApi.sendTeamMessage({ lecturerUserId, subject, body });
      setSubject('');
      setBody('');
      setOk('ההודעה נשלחה');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="border-t border-white/10 pt-4 grid gap-3">
      <p className="text-xs text-white/45">הודעה פנימית אל {lecturerName}</p>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="נושא"
        className={fieldClass}
        disabled={disabled || pending}
      />
      <textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="תוכן ההודעה"
        className={fieldClass}
        disabled={disabled || pending}
      />
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      {ok ? <p className="text-xs text-emerald-300">{ok}</p> : null}
      <button
        type="button"
        disabled={disabled || pending || !subject.trim() || !body.trim()}
        onClick={() => void send()}
        className="w-fit px-4 py-2 rounded-full bg-[#C8A24C] text-black text-xs min-h-10 disabled:opacity-60 cursor-pointer"
      >
        {pending ? 'שולח...' : 'שליחת הודעה'}
      </button>
    </div>
  );
}
