import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarPlus, Check, MessageCircle, Share2, UserRound, Video } from 'lucide-react';
import { webinarApi } from '../../api/webinar';
import { DEFAULT_WEBINAR_CONFIG } from '../../constants/webinar';
import {
  WEBINAR_CTA_ENDED,
  WEBINAR_ENDED_NOTE,
  webinarLiveEnter,
} from '../../constants/webinarPage';
import { buildGoogleCalendarUrl, buildShareUrl, downloadIcs, getWebinarPhase } from '../../utils/webinarTime';
import { trackEvent } from '../../utils/analytics';

type LocalSteps = { calendar: boolean; whatsapp: boolean };

function stepsKey(id: string) {
  return `webinar-ty:${id}`;
}

function loadLocalSteps(id: string): LocalSteps {
  if (!id) return { calendar: false, whatsapp: false };
  try {
    const raw = localStorage.getItem(stepsKey(id));
    if (!raw) return { calendar: false, whatsapp: false };
    const parsed = JSON.parse(raw) as Partial<LocalSteps>;
    return { calendar: Boolean(parsed.calendar), whatsapp: Boolean(parsed.whatsapp) };
  } catch {
    return { calendar: false, whatsapp: false };
  }
}

function saveLocalSteps(id: string, steps: LocalSteps) {
  if (!id) return;
  try {
    localStorage.setItem(stepsKey(id), JSON.stringify(steps));
  } catch {
    /* ignore */
  }
}

function StepIndex({ done, n }: { done: boolean; n: number }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
        done ? 'bg-[#C8A24C] text-black' : 'border border-[#C8A24C]/50 text-[#F7E7B5]'
      }`}
      aria-hidden
    >
      {done ? <Check className="w-4 h-4" strokeWidth={2.5} /> : n}
    </span>
  );
}

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
  const [localSteps, setLocalSteps] = useState<LocalSteps>(() => loadLocalSteps(registrationId));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    window.scrollTo(0, 0);
    webinarApi.config().then(setPayload).catch(() => null);
    if (!registrationId) return;
    setLocalSteps(loadLocalSteps(registrationId));
    webinarApi
      .resume(registrationId)
      .then(({ registration }) => {
        setPersonPicked(Boolean(registration.personPicked));
      })
      .catch(() => undefined);
  }, [registrationId]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const config = payload?.config || DEFAULT_WEBINAR_CONFIG;
  const calendarConfig = useMemo(() => ({ ...config, date, time }), [config, date, time]);
  const googleUrl = buildGoogleCalendarUrl(calendarConfig);
  const zoomLink = config.zoomLink.trim();
  const liveEnter = webinarLiveEnter(config.zoomLink, config.whatsappGroupUrl);
  const phase = payload
    ? getWebinarPhase(config.date, config.time, config.durationMinutes, now)
    : 'upcoming';

  const markLocal = (step: keyof LocalSteps) => {
    setLocalSteps((prev) => {
      const next = { ...prev, [step]: true };
      saveLocalSteps(registrationId, next);
      return next;
    });
  };

  const markCalendar = (provider: string) => {
    trackEvent('add_to_calendar_clicked', { provider });
    trackEvent('webinar_add_to_calendar_clicked', { provider });
    trackEvent('webinar_thank_you_step_completed', { step: 'calendar' });
    markLocal('calendar');
  };

  const markWhatsapp = () => {
    trackEvent('whatsapp_group_clicked');
    trackEvent('webinar_whatsapp_group_clicked');
    trackEvent('webinar_thank_you_step_completed', { step: 'whatsapp' });
    markLocal('whatsapp');
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#010308]/35 via-transparent to-[#010308]/50" />

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
          <p className="text-white/55 font-light leading-relaxed mb-6">
            {isWaitlist
              ? 'הפרטים שלך נקלטו לרשימת ההמתנה. נעדכן כשיתפנה מקום.'
              : `נרשמת בהצלחה. שלושה צעדים לפני הערב: יומן, וואטסאפ, ואדם אחד. ${date}, ${time}.`}
          </p>

          {phase === 'live' && liveEnter.href ? (
            <a
              href={liveEnter.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('webinar_cta_clicked', { section: 'thank_you_enter' })}
              className="btn-gold text-black mb-8 w-full px-5 py-3 text-sm"
            >
              {liveEnter.label}
            </a>
          ) : null}

          {phase === 'ended' ? (
            <p className="mb-8 text-sm text-white/50 font-light">
              {WEBINAR_CTA_ENDED}. {WEBINAR_ENDED_NOTE}
            </p>
          ) : null}

          <ol className="space-y-4 text-right mb-8">
            <li
              className={`rounded-2xl border px-5 py-4 ${
                localSteps.calendar
                  ? 'border-[#C8A24C]/50 bg-[#C8A24C]/10'
                  : 'border-[#C8A24C]/25 bg-[#010308]/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <StepIndex done={localSteps.calendar} n={1} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-white mb-1">
                    <CalendarPlus className="w-4 h-4 text-[#C8A24C]" aria-hidden />
                    הוספה ליומן
                    {localSteps.calendar ? (
                      <span className="text-[11px] text-[#F7E7B5]">בוצע</span>
                    ) : null}
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
                    className="btn-gold text-black w-full px-5 py-3 text-sm"
                  >
                    {localSteps.calendar ? 'נוסף ליומן' : 'הוספה ליומן'}
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

            <li
              className={`rounded-2xl border px-5 py-4 ${
                localSteps.whatsapp
                  ? 'border-[#C8A24C]/50 bg-[#C8A24C]/10'
                  : 'border-[#C8A24C]/25 bg-[#010308]/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <StepIndex done={localSteps.whatsapp} n={2} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-white mb-1">
                    <MessageCircle className="w-4 h-4 text-[#C8A24C]" aria-hidden />
                    קבוצת עדכונים שקטה
                    {localSteps.whatsapp ? (
                      <span className="text-[11px] text-[#F7E7B5]">בוצע</span>
                    ) : null}
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
                      {localSteps.whatsapp ? 'הצטרפת' : 'הצטרפות עכשיו'}
                    </a>
                  ) : (
                    <p className="text-xs text-white/40 font-light">הקישור יישלח באישור המייל.</p>
                  )}
                </div>
              </div>
            </li>

            <li
              className={`rounded-2xl border px-5 py-4 ${
                personPicked
                  ? 'border-[#C8A24C]/50 bg-[#C8A24C]/10'
                  : 'border-[#C8A24C]/25 bg-[#010308]/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <StepIndex done={personPicked} n={3} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-white mb-1">
                    <UserRound className="w-4 h-4 text-[#C8A24C]" aria-hidden />
                    אדם אחד
                    {personPicked ? <span className="text-[11px] text-[#F7E7B5]">בוצע</span> : null}
                  </p>
                  <p id="webinar-person-hint" className="text-xs text-white/45 font-light mb-3">
                    שם, וואטסאפ, ומשפט אחד על מה שאת/ה מציע/ה. זה אדם להצעה שלך, לא הזמנת חבר לוובינר.
                  </p>
                  <label className="inline-flex items-center gap-2 cursor-pointer min-h-11">
                    <input
                      type="checkbox"
                      checked={personPicked}
                      aria-describedby="webinar-person-hint"
                      onChange={(e) => persistPersonPicked(e.target.checked)}
                      className="accent-[#C8A24C] min-w-4 min-h-4 cursor-pointer"
                    />
                    <span className="text-sm text-[#F7E7B5]">בחרתי אדם</span>
                  </label>
                </div>
              </div>
            </li>
          </ol>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm text-white/75 hover:text-white min-h-11 cursor-pointer transition-colors duration-200 mb-3"
          >
            חזרה לאתר
          </Link>

          <button
            type="button"
            onClick={() => void share()}
            className="flex mx-auto items-center gap-2 text-[11px] text-white/35 hover:text-white/55 min-h-11 cursor-pointer transition-colors duration-200"
          >
            <Share2 className="w-3.5 h-3.5" aria-hidden />
            {copied ? 'הקישור הועתק' : 'להזמין מישהו לערב'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
