import { FormEvent, useId, useState } from 'react';
import { submitAccessibilityReport } from '../api/accessibility';

type FieldErrors = {
  fullName?: string;
  email?: string;
  message?: string;
};

export function AccessibilityReportForm() {
  const formId = useId();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = 'נא למלא שם מלא';
    if (!email.trim()) next.email = 'נא למלא כתובת דוא״ל';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'כתובת דוא״ל לא תקינה';
    if (!message.trim() || message.trim().length < 10) {
      next.message = 'נא לתאר את המחסום ב־10 תווים לפחות';
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('יש לתקן את השדות המסומנים');
      return;
    }
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
      setFieldErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id={formId}
      dir="rtl"
      onSubmit={(event) => void handleSubmit(event)}
      className="grid gap-4 border border-white/10 rounded-2xl p-5 bg-white/[0.02]"
      aria-describedby={`${formId}-hint`}
      noValidate
    >
      <p id={`${formId}-hint`} className="text-sm text-slate-400">
        טופס זה נגיש לקוראי מסך ולניווט מקלדת. ניתן גם לפנות בדוא&quot;ל או בטלפון.
      </p>

      {error ? (
        <p id={`${formId}-form-error`} role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" aria-live="polite" className="text-sm text-emerald-300">
          {success}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label htmlFor={`${formId}-name`} className="text-sm text-white/80">
          שם מלא <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${formId}-name`}
          name="fullName"
          type="text"
          required
          aria-required="true"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          aria-invalid={fieldErrors.fullName ? true : undefined}
          aria-describedby={fieldErrors.fullName ? `${formId}-name-error` : undefined}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
        />
        {fieldErrors.fullName ? (
          <span id={`${formId}-name-error`} role="alert" className="text-sm text-rose-300">
            {fieldErrors.fullName}
          </span>
        ) : null}
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
          aria-required="true"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? `${formId}-email-error` : undefined}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
        />
        {fieldErrors.email ? (
          <span id={`${formId}-email-error`} role="alert" className="text-sm text-rose-300">
            {fieldErrors.email}
          </span>
        ) : null}
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
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
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
          aria-required="true"
          minLength={10}
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={fieldErrors.message ? `${formId}-message-error` : undefined}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043]"
        />
        {fieldErrors.message ? (
          <span id={`${formId}-message-error`} role="alert" className="text-sm text-rose-300">
            {fieldErrors.message}
          </span>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-fit px-6 py-3 rounded-full bg-[#b79043] text-black font-medium min-h-11 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0b08]"
      >
        {submitting ? 'שולח…' : 'שליחת פנייה'}
      </button>
    </form>
  );
}
