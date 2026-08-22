import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarPlus, MessageCircle, ArrowLeft, Share2, CheckCircle2 } from 'lucide-react';
import { webinarApi } from '../../api/webinar';
import { DEFAULT_WEBINAR_CONFIG } from '../../constants/webinar';
import { WebinarQualifyForm } from '../components/WebinarQualifyForm';
import { buildGoogleCalendarUrl, buildShareUrl, downloadIcs } from '../../utils/webinarTime';
import { trackEvent } from '../../utils/analytics';

export function WebinarThankYou() {
  const [params] = useSearchParams();
  const name = params.get('name') || '';
  const registrationId = params.get('id') || '';
  const date = params.get('date') || DEFAULT_WEBINAR_CONFIG.date;
  const time = params.get('time') || DEFAULT_WEBINAR_CONFIG.time;
  const isWaitlist = params.get('waitlist') === '1';
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof webinarApi.config>> | null>(null);
  const [calendarDone, setCalendarDone] = useState(false);
  const [waDone, setWaDone] = useState(false);
  const [qualifyDone, setQualifyDone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    webinarApi.config().then(setPayload).catch(() => null);
  }, []);

  const config = payload?.config || DEFAULT_WEBINAR_CONFIG;
  const calendarConfig = useMemo(() => ({ ...config, date, time }), [config, date, time]);
  const googleUrl = buildGoogleCalendarUrl(calendarConfig);
  const pricingUnlocked = calendarDone || waDone || isWaitlist;

  const markCalendar = (provider: string) => {
    setCalendarDone(true);
    trackEvent('webinar_add_to_calendar_clicked', { provider });
    trackEvent('webinar_thank_you_step_completed', { step: 'calendar' });
  };

  const markWhatsapp = () => {
    setWaDone(true);
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
            {name ? `${name}, ` : ''}עכשיו מתחיל החלק החשוב.
          </h1>
          <p className="text-white/55 font-light leading-relaxed mb-8">
            {isWaitlist
              ? 'נעדכן כשיתפנה מקום. עד אז — אפשר להוסיף ליומן ולהצטרף לעדכונים.'
              : `ההרשמה התקבלה. שמר/י את התאריך: ${date} · ${time}. נשלח קישור לפני הוובינר.`}
          </p>

          <ol className="space-y-4 mb-8 text-right">
            <li className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-white mb-3">
                <CheckCircle2 className={`w-4 h-4 ${calendarDone ? 'text-[#C8A24C]' : 'text-white/30'}`} />
                <span className="text-sm">שלב 1 — הוספ/י ליומן</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {googleUrl ? (
                  <a
                    href={googleUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => markCalendar('google')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#C8A24C]/40 px-5 py-3 text-sm text-white min-h-11 hover:bg-[#C8A24C]/10"
                  >
                    <CalendarPlus className="w-4 h-4 text-[#C8A24C]" />
                    Google Calendar
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    markCalendar('ics');
                    downloadIcs(calendarConfig);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white min-h-11"
                >
                  <CalendarPlus className="w-4 h-4 text-[#C8A24C]" />
                  קובץ יומן
                </button>
              </div>
            </li>

            {config.whatsappGroupUrl ? (
              <li className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-white mb-3">
                  <CheckCircle2 className={`w-4 h-4 ${waDone ? 'text-[#C8A24C]' : 'text-white/30'}`} />
                  <span className="text-sm">שלב 2 — הצטרפ/י לעדכונים</span>
                </div>
                <a
                  href={config.whatsappGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={markWhatsapp}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-[#C8A24C] text-black px-6 py-3 text-sm font-semibold min-h-11"
                >
                  <MessageCircle className="w-4 h-4" />
                  קבוצת וואטסאפ
                </a>
              </li>
            ) : null}

            {!isWaitlist && registrationId && !qualifyDone ? (
              <li className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-white mb-3">
                  <CheckCircle2 className="w-4 h-4 text-white/30" />
                  <span className="text-sm">שלב 3 — 3 שאלות קצרות (אופציונלי)</span>
                </div>
                <WebinarQualifyForm registrationId={registrationId} onComplete={() => setQualifyDone(true)} />
              </li>
            ) : null}
          </ol>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 mb-6 text-sm text-white/50 font-light">
            <p className="mb-2">נשלח תזכורת 24 שעות ו-1 שעה לפני הוובינר (אם הגדרת מייל).</p>
            <button type="button" onClick={() => void share()} className="inline-flex items-center gap-2 text-[#C8A24C] hover:text-[#F7E7B5] min-h-11">
              <Share2 className="w-4 h-4" />
              {copied ? 'הקישור הועתק' : 'הבא/י חבר/ה לוובינר'}
            </button>
          </div>

          {pricingUnlocked ? (
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center w-full rounded-full border border-white/15 px-6 py-3 text-sm text-white/75 hover:text-white min-h-11 mb-4"
            >
              רוצה לבדוק התאמה למסלול?
            </Link>
          ) : (
            <p className="text-xs text-white/35 mb-4">הוסף/י ליומן או הצטרף/י לוואטסאפ כדי לפתוח את קישור בדיקת ההתאמה.</p>
          )}

          <Link to="/webinar" className="inline-flex items-center justify-center gap-2 text-white/45 hover:text-white text-sm min-h-11">
            <ArrowLeft className="w-4 h-4" />
            חזרה לדף הוובינר
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
