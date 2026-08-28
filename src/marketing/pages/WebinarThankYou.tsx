import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarPlus, MessageCircle, Share2 } from 'lucide-react';
import { webinarApi } from '../../api/webinar';
import { DEFAULT_WEBINAR_CONFIG } from '../../constants/webinar';
import { buildGoogleCalendarUrl, buildShareUrl, downloadIcs } from '../../utils/webinarTime';
import { trackEvent } from '../../utils/analytics';

export function WebinarThankYou() {
  const [params] = useSearchParams();
  const name = params.get('name') || '';
  const date = params.get('date') || DEFAULT_WEBINAR_CONFIG.date;
  const time = params.get('time') || DEFAULT_WEBINAR_CONFIG.time;
  const isWaitlist = params.get('waitlist') === '1';
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof webinarApi.config>> | null>(null);
  const [copied, setCopied] = useState(false);
  const [personPicked, setPersonPicked] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    webinarApi.config().then(setPayload).catch(() => null);
  }, []);

  const config = payload?.config || DEFAULT_WEBINAR_CONFIG;
  const calendarConfig = useMemo(() => ({ ...config, date, time }), [config, date, time]);
  const googleUrl = buildGoogleCalendarUrl(calendarConfig);

  const markCalendar = (provider: string) => {
    trackEvent('add_to_calendar_clicked', { provider });
    trackEvent('webinar_add_to_calendar_clicked', { provider });
    trackEvent('webinar_thank_you_step_completed', { step: 'calendar' });
  };

  const markWhatsapp = () => {
    trackEvent('whatsapp_group_clicked');
    trackEvent('webinar_whatsapp_group_clicked');
    trackEvent('webinar_thank_you_step_completed', { step: 'whatsapp' });
  };

  const share = async () => {
    const url = buildShareUrl();
    try {
      if (navigator.share) {
        await navigator.share({ title: config.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="min-h-screen relative pt-32 pb-32 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-[#010308] via-transparent to-[#010308]" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-[#C8A24C]/25 bg-[#C8A24C]/5 p-8 md:p-12 text-right"
        >
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C8A24C] mb-4">
            {isWaitlist ? 'נרשמת לרשימת המתנה' : 'נרשמת לוובינר'}
          </p>
          <h1 className="text-3xl md:text-4xl font-light text-white mb-4">
            {name ? `${name}, ` : ''}נרשמת. עכשיו שני צעדים: וואטסאפ ויומן.
          </h1>
          <p className="text-white/55 font-light leading-relaxed mb-6">
            {isWaitlist
              ? 'הפרטים שלך נקלטו לרשימת ההמתנה. נעדכן כשיתפנה מקום.'
              : `הפרטים שלך נקלטו. שמרו את התאריך ביומן: ${date} · ${time}. קישור Zoom יישלח לפני הערב.`}
          </p>

          <label className="flex items-start gap-3 rounded-2xl border border-[#C8A24C]/25 bg-[#010308]/40 px-5 py-4 text-sm text-[#F7E7B5] font-light leading-relaxed mb-8 cursor-pointer text-right">
            <input
              type="checkbox"
              checked={personPicked}
              onChange={(e) => setPersonPicked(e.target.checked)}
              className="mt-1 accent-[#C8A24C] min-w-4 min-h-4 cursor-pointer"
            />
            <span>בחר/י אדם אחד שעשוי להתאים להצעה שלך. בוובינר נבצע פעולה אמיתית.</span>
          </label>

          {config.whatsappGroupUrl ? (
            <a
              href={config.whatsappGroupUrl}
              target="_blank"
              rel="noreferrer"
              onClick={markWhatsapp}
              className="mb-4 inline-flex items-center justify-center gap-2 w-full rounded-full bg-[#C8A24C] text-black px-5 py-3 text-sm font-semibold min-h-11 cursor-pointer hover:opacity-95 transition-opacity duration-200"
            >
              <MessageCircle className="w-4 h-4" aria-hidden />
              הצטרפות לקבוצת עדכונים שקטה
            </a>
          ) : (
            <p className="mb-4 text-xs text-white/40 font-light">קישור לקבוצת עדכונים שקטה יישלח באישור המייל.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {googleUrl ? (
              <a
                href={googleUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => markCalendar('google')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#C8A24C]/40 px-5 py-3 text-sm text-white min-h-11 cursor-pointer hover:bg-[#C8A24C]/10 transition-colors duration-200"
              >
                <CalendarPlus className="w-4 h-4 text-[#C8A24C]" aria-hidden />
                הוספה ליומן
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => {
                markCalendar('ics');
                downloadIcs(calendarConfig);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white min-h-11 cursor-pointer hover:border-[#C8A24C]/40 transition-colors duration-200"
            >
              <CalendarPlus className="w-4 h-4 text-[#C8A24C]" aria-hidden />
              קובץ יומן
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm text-white/75 hover:text-white min-h-11 cursor-pointer transition-colors duration-200"
            >
              חזרה לאתר
            </Link>
            <Link
              to="/pricing"
              onClick={() => trackEvent('pilot_cta_clicked', { source: 'thank_you' })}
              className="text-xs text-white/35 hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer transition-colors duration-200"
            >
              מידע על הפיילוט
            </Link>
          </div>

          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex items-center gap-2 text-[#C8A24C] hover:text-[#F7E7B5] min-h-11 cursor-pointer transition-colors duration-200"
          >
            <Share2 className="w-4 h-4" aria-hidden />
            {copied ? 'הקישור הועתק' : 'הבא/י חבר/ה לוובינר'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
