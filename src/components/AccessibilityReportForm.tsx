import { FormEvent, useId, useState } from 'react';
import { submitAccessibilityReport } from '../api/accessibility';

export function AccessibilityReportForm() {
  const formId = useId();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await submitAccessibilityReport({
        fullName,
        email,
        phone,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        message,
      });
      setSuccess('הפנייה התקבלה. נחזור אליך בהקדם האפשר.');
      setFullName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id={formId}
      onSubmit={(event) => void handleSubmit(event)}
      className="grid gap-4 border border-white/10 rounded-2xl p-5 bg-white/[0.02]"
      aria-describedby={`${formId}-hint`}
      noValidate
    >
      <p id={`${formId}-hint`} className="text-sm text-slate-400">
        טופס זה נגיש לקוראי מסך ולניווט מקלדת. ניתן גם לפנות בדוא&quot;ל או בטלפון.
      </p>

      <div role="alert" aria-live="polite" className="min-h-[1.25rem]">
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${formId}-name`} className="text-sm text-white/80">
          שם מלא <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${formId}-name`}
          name="fullName"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${formId}-email`} className="text-sm text-white/80">
          דוא&quot;ל <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${formId}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${formId}-phone`} className="text-sm text-white/80">
          טלפון (אופציונלי)
        </label>
        <input
          id={`${formId}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          dir="ltr"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${formId}-message`} className="text-sm text-white/80">
          תיאור המחסום או הבקשה <span aria-hidden="true">*</span>
        </label>
        <textarea
          id={`${formId}-message`}
          name="message"
          required
          minLength={10}
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C]"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-fit px-6 py-3 rounded-full bg-[#C8A24C] text-black font-medium min-h-11 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#010308]"
      >
        {submitting ? 'שולח…' : 'שליחת פנייה'}
      </button>
    </form>
  );
}
