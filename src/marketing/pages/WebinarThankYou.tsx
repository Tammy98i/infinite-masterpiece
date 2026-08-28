import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarPlus, MessageCircle, Share2, UserRound, Video } from 'lucide-react';
import { webinarApi } from '../../api/webinar';
import { DEFAULT_WEBINAR_CONFIG } from '../../constants/webinar';
import { buildGoogleCalendarUrl, buildShareUrl, downloadIcs } from '../../utils/webinarTime';
import { trackEvent } from '../../utils/analytics';

export function WebinarThankYou() {
  const [params] = useSearchParams();
  const registrationId = params.get('id')?.trim() || '';
  const name = params.get('name') || '';
  const firstName = name.trim().split(/\s+/)[0] || '';
  const date = params.get('date') || DEFAULT_WEBINAR_CONFIG.date;
  const time = params.get('time') || DEFAULT_WEBINAR_CONFIG.time;
  const isWaitlist = params.get('waitlist') === '1';
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof webinarApi.config>> | null>(null);
  const [copied, setCopied] = useState(false);
  const [personPicked, setPersonPicked] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    webinarApi.config().then(setPayload).catch(() => null);
    if (!registrationId) return;
    webinarApi
      .resume(registrationId)
      .then(({ registration }) => {
        setPersonPicked(Boolean(registration.personPicked));
      })
      .catch(() => undefined);
  }, [registrationId]);

  const config = payload?.config || DEFAULT_WEBINAR_CONFIG;
  const calendarConfig = useMemo(() => ({ ...config, date, time }), [config, date, time]);
  const googleUrl = buildGoogleCalendarUrl(calendarConfig);
  const zoomLink = config.zoomLink.trim();

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

  const persistPersonPicked = (picked: boolean) => {
    setPersonPicked(picked);
    if (picked) {
      trackEvent('webinar_thank_you_step_completed', { step: 'person' });
    }
    if (!registrationId) return;
    webinarApi.personPicked(registrationId, picked).catch(() => undefined);
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
          className="rounded-3xl border border-[#C8A24C]/25 bg-[#C8A24C]/5 p-8 md:p-12 text-center"
        >
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C8A24C] mb-4">
            {isWaitlist ? 'נרשמת לרשימת המתנה' : 'נרשמת לוובינר'}
          </p>
          <h1 className="text-3xl md:text-4xl font-light text-white mb-4">
            {firstName ? `תודה, ${firstName}.` : 'נרשמת.'}
          </h1>
          <p className="text-white/55 font-light leading-relaxed mb-8">
            {isWaitlist
              ? 'הפרטים שלך נקלטו לרשימת ההמתנה. נעדכן כשיתפנה מקום.'
              : `נרשמת בהצלחה. שלושה צעדים לפני הערב: יומן, וואטסאפ, ואדם אחד. ${date}, ${time}.`}
          </p>

          <ol className="space-y-4 text-right mb-8">
            <li className="rounded-2xl border border-[#C8A24C]/25 bg-[#010308]/40 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C8A24C]/50 text-sm text-[#F7E7B5]">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-white mb-1">
                    <CalendarPlus className="w-4 h-4 text-[#C8A24C]" aria-hidden />
                    הוספה ליומן
                  </p>
                  <p className="text-xs text-white/45 font-light mb-3">
                    {date} · {time}.
                    {zoomLink ? ' קישור Zoom למטה.' : ' קישור Zoom יישלח לפני הערב.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      markCalendar('ics');
                      downloadIcs(calendarConfig);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] px-5 py-3 text-sm font-semibold text-black min-h-11 cursor-pointer hover:opacity-95 transition-opacity duration-200"
                  >
                    הוספה ליומן
                  </button>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/40">
                    {googleUrl ? (
                      <a
                        href={googleUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => markCalendar('google')}
                        className="hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer transition-colors duration-200"
                      >
                        Google
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        markCalendar('ics');
                        downloadIcs(calendarConfig);
                      }}
                      className="hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer transition-colors duration-200"
                    >
                      Apple / Outlook
                    </button>
                  </p>
                  {zoomLink ? (
                    <a
                      href={zoomLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-[11px] text-white/40 hover:text-[#F7E7B5] min-h-11 cursor-pointer transition-colors duration-200"
                    >
                      <Video className="w-4 h-4" aria-hidden />
                      קישור Zoom
                    </a>
                  ) : null}
                </div>
              </div>
            </li>

            <li className="rounded-2xl border border-[#C8A24C]/25 bg-[#010308]/40 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C8A24C]/50 text-sm text-[#F7E7B5]">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-white mb-1">
                    <MessageCircle className="w-4 h-4 text-[#C8A24C]" aria-hidden />
                    קבוצת עדכונים שקטה
                  </p>
                  <p className="text-xs text-white/45 font-light mb-3">נעדכן רק כשיש משהו שחשוב לדעת.</p>
                  {config.whatsappGroupUrl ? (
                    <a
                      href={config.whatsappGroupUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={markWhatsapp}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C8A24C] text-black px-5 py-2 text-sm font-semibold min-h-11 cursor-pointer hover:opacity-95 transition-opacity duration-200"
                    >
                      הצטרפות עכשיו
                    </a>
                  ) : (
                    <p className="text-xs text-white/40 font-light">הקישור יישלח באישור המייל.</p>
                  )}
                </div>
              </div>
            </li>

            <li className="rounded-2xl border border-[#C8A24C]/25 bg-[#010308]/40 px-5 py-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C8A24C]/50 text-sm text-[#F7E7B5]">
                  3
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-white mb-1">
                    <UserRound className="w-4 h-4 text-[#C8A24C]" aria-hidden />
                    אדם אחד
                  </span>
                  <span id="webinar-person-hint" className="block text-xs text-white/45 font-light mb-3">
                    שם, וואטסאפ, ומשפט אחד על מה שאת/ה מציע/ה.
                  </span>
                  <input
                    type="checkbox"
                    checked={personPicked}
                    aria-describedby="webinar-person-hint"
                    onChange={(e) => persistPersonPicked(e.target.checked)}
                    className="accent-[#C8A24C] min-w-4 min-h-4 cursor-pointer"
                  />
                  <span className="mr-2 text-sm text-[#F7E7B5]">בחרתי אדם</span>
                </span>
              </label>
            </li>
          </ol>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm text-white/75 hover:text-white min-h-11 cursor-pointer transition-colors duration-200 mb-4"
          >
            חזרה לאתר
          </Link>

          <button
            type="button"
            onClick={() => void share()}
            className="flex mx-auto items-center gap-2 text-[#C8A24C] hover:text-[#F7E7B5] min-h-11 cursor-pointer transition-colors duration-200"
          >
            <Share2 className="w-4 h-4" aria-hidden />
            {copied ? 'הקישור הועתק' : 'הבא/י חבר/ה לוובינר'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
