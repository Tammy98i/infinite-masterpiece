import { FormEvent, useState } from 'react';
import { webinarApi } from '../../api/webinar';
import { WEBINAR_BLOCKER_OPTIONS, WEBINAR_INTEREST_OPTIONS } from '../../constants/webinar';
import { trackEvent } from '../../utils/analytics';

type Props = {
  registrationId: string;
  onComplete: () => void;
};

export function WebinarQualifyForm({ registrationId, onComplete }: Props) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    trackEvent('webinar_step_b_started', { source: 'thank_you', registrationId });
    const data = new FormData(e.currentTarget);
    try {
      await webinarApi.register({
        step: 'b',
        registrationId,
        field: String(data.get('field') || ''),
        interest: String(data.get('interest') || ''),
        blocker: String(data.get('blocker') || ''),
      });
      trackEvent('webinar_thank_you_step_completed', { step: 'qualify' });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full bg-[#010308]/60 border border-[#C8A24C]/25 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C8A24C] min-h-11';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-right">
      <p className="text-sm text-white/70 font-light mb-2">עזר/י לנו להתאים את הוובינר אליך</p>
      <input required name="field" placeholder="תחום יצירה / עיסוק" className={fieldClass} />
      <select required name="interest" className={fieldClass} defaultValue="">
        <option value="" disabled>
          מה הכי מסקרן אותך?
        </option>
        {WEBINAR_INTEREST_OPTIONS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select name="blocker" className={fieldClass} defaultValue="">
        <option value="">מה הכי תוקע אותך? (אופציונלי)</option>
        {WEBINAR_BLOCKER_OPTIONS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-full bg-[#C8A24C] text-black text-sm font-semibold min-h-11 disabled:opacity-50"
      >
        {submitting ? 'שולח…' : 'שמירת התשובות'}
      </button>
    </form>
  );
}
