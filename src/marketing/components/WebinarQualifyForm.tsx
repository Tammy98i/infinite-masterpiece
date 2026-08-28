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
    <form onSubmit={handleSubmit} className="space-y-3 text-center">
      <p className="text-sm text-white/70 font-light mb-2">עזר/י לנו להתאים את הוובינר אליך</p>
      <div>
        <label htmlFor="qualify-field" className="text-xs text-white/60 mb-1 block">
          תחום יצירה / עיסוק *
        </label>
        <input required id="qualify-field" name="field" className={fieldClass} />
      </div>
      <div>
        <label htmlFor="qualify-interest" className="text-xs text-white/60 mb-1 block">
          איפה את/ה נמצא/ת היום? *
        </label>
        <select required id="qualify-interest" name="interest" className={`${fieldClass} cursor-pointer`} defaultValue="">
          <option value="" disabled>
            בחר/י
          </option>
          {WEBINAR_INTEREST_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="qualify-blocker" className="text-xs text-white/60 mb-1 block">
          מה צוואר הבקבוק המרכזי שלך?
        </label>
        <select id="qualify-blocker" name="blocker" className={`${fieldClass} cursor-pointer`} defaultValue="">
          <option value="">לא חובה</option>
          {WEBINAR_BLOCKER_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-rose-300" role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="btn-gold text-black w-full py-3 text-sm"
      >
        {submitting ? 'שולח…' : 'שמירת התשובות'}
      </button>
    </form>
  );
}
