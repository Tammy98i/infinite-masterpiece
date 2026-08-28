import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ChevronDown, Handshake, Megaphone, Network, Tag, Target, X } from 'lucide-react';
import { webinarApi } from '../../api/webinar';
import {
  DEFAULT_WEBINAR_CONFIG,
  WEBINAR_FAQ,
  splitHeroHeadline,
  type WebinarPublicPayload,
} from '../../constants/webinar';
import {
  WEBINAR_AUDIENCE_LABEL,
  WEBINAR_BOTTLENECKS,
  WEBINAR_CTA_ENDED,
  WEBINAR_CTA_FIT,
  WEBINAR_CTA_FIT_LINK,
  WEBINAR_CTA_NOT_REGISTERED,
  WEBINAR_CTA_PRIMARY,
  WEBINAR_ENDED_NOTE,
  WEBINAR_FIT_NO,
  WEBINAR_FIT_YES,
  WEBINAR_GLEB,
  WEBINAR_HOLDING_LINE,
  WEBINAR_PUNCHLINE,
  WEBINAR_REGISTER_ID,
  WEBINAR_TASK_STEPS,
  WEBINAR_TRACKS_FINE_PRINT,
  webinarLiveEnter,
} from '../../constants/webinarPage';
import { WebinarRegistrationForm } from '../components/WebinarRegistrationForm';
import { WebinarStickyCta } from '../components/WebinarStickyCta';
import { WebinarSectionCta } from '../components/WebinarSocialProof';
import { WebinarCountdown } from '../components/WebinarCountdown';
import { trackEvent, trackWebinarCta, scrollToWebinarForm, scrollToWebinarFit } from '../../utils/analytics';
import { captureUtmFromSearch } from '../../utils/utm';
import { getWebinarPhase } from '../../utils/webinarTime';
import { TeamPhoto } from '../../components/TeamPhoto';

const bottleneckIcons = [Tag, Handshake, Megaphone, Network, Target];

function FaqItem({ q, a, ...props }: { q: string; a: string } & HTMLAttributes<HTMLDetailsElement>) {
  return (
    <details {...props} className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-white font-light min-h-11">
        <span>{q}</span>
        <ChevronDown className="w-4 h-4 text-[#C8A24C] group-open:rotate-180 transition-transform duration-200 shrink-0" />
      </summary>
      <p className="mt-4 text-sm text-white/50 font-light leading-relaxed">{a}</p>
    </details>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.25em] text-[#C8A24C] mb-4">{children}</p>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-3xl md:text-5xl font-heading text-white mb-6 leading-tight mx-auto max-w-3xl">{children}</h2>;
}

const REGISTER_CARD_CLASS =
  'rounded-3xl border border-[#C8A24C]/30 bg-[#010308]/80 backdrop-blur-xl shadow-2xl shadow-black/40 p-5 sm:p-8 lg:p-10';

function HostFaces() {
  const hosts = [
    { name: 'גל', src: '/team/gal.png' },
    { name: 'תמי', src: '/team/tami.png' },
    { name: 'גלב', src: '/team/gleb.png' },
  ];
  return (
    <div className="flex items-center justify-center gap-3 mb-5 sm:mb-6">
      <div className="flex -space-x-3 space-x-reverse sm:-space-x-4">
        {hosts.map((host) => (
          <span key={host.name} className="inline-flex">
            <TeamPhoto
              src={host.src}
              name={host.name}
              alt={host.name}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-[#C8A24C]/50 text-[11px] sm:text-sm"
            />
          </span>
        ))}
      </div>
      <p className="text-xs sm:text-sm text-white/50 font-light">גל, תמי וגלב בלייב</p>
    </div>
  );
}

function WebinarRegisterCard({
  payload,
  formId,
  headlineParts,
}: {
  payload: WebinarPublicPayload;
  formId: string;
  headlineParts: { line1: string; line2: string };
}) {
  return (
    <>
      <p className="text-lg sm:text-xl md:text-2xl text-white font-light leading-snug mb-4 sm:mb-5 text-right">
        {headlineParts.line1}
        {headlineParts.line2 ? (
          <>
            {' '}
            <span className="text-gold-gradient font-medium">{headlineParts.line2}</span>
          </>
        ) : null}
      </p>
      <HostFaces />
      <WebinarRegistrationForm payload={payload} formId={formId} />
    </>
  );
}

export function WebinarLanding() {
  const [payload, setPayload] = useState<WebinarPublicPayload>(() => ({
    config: DEFAULT_WEBINAR_CONFIG,
    registrationCount: 0,
    completeCount: 0,
    spotsRemaining: null,
    isWaitlist: false,
    abVariant: 'a',
    activeHeadline: DEFAULT_WEBINAR_CONFIG.heroHeadline,
  }));
  const fitRef = useRef<HTMLElement>(null);
  const fitTracked = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    captureUtmFromSearch(window.location.search);
    trackEvent('webinar_page_view');
    webinarApi
      .config()
      .then((res) => {
        setPayload(res);
        setConfigReady(true);
      })
      .catch(() => setConfigReady(true));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const node = fitRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (fitTracked.current || !entries.some((e) => e.isIntersecting)) return;
        fitTracked.current = true;
        trackEvent('webinar_fit_section_viewed');
        observer.disconnect();
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { config, activeHeadline } = payload;
  const headlineParts = splitHeroHeadline(activeHeadline);
  const eventPhase = configReady
    ? getWebinarPhase(config.date, config.time, config.durationMinutes, now)
    : 'upcoming';
  const eventNight = eventPhase === 'live';
  const eventEnded = eventPhase === 'ended';
  const liveEnter = webinarLiveEnter(config.zoomLink, config.whatsappGroupUrl);

  const scrollToForm = (section = 'hero') => {
    trackWebinarCta(section);
    scrollToWebinarForm();
  };

  const hosts = [
    {
      name: config.leaderPrimaryName,
      title: config.leaderPrimaryTitle,
      bio: config.leaderPrimaryBio,
      image: '/team/gal.png',
    },
    {
      name: config.leaderSecondaryName,
      title: config.leaderSecondaryTitle,
      bio: config.leaderSecondaryBio,
      image: '/team/tami.png',
    },
    {
      name: WEBINAR_GLEB.name,
      title: WEBINAR_GLEB.title,
      bio: WEBINAR_GLEB.bio,
      image: '/team/gleb.png',
    },
  ];

  return (
    <div className="w-full pb-28">
      <section id="webinar-hero" className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#010308]/40 via-transparent to-[#010308]/55" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[min(900px,90vw)] h-[320px] bg-[radial-gradient(ellipse_at_center,rgba(200,162,76,0.18),transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center flex flex-col items-center"
            >
              <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 rounded-full bg-white/[0.03] border border-[#C8A24C]/20 mb-8">
                <span className={`w-2 h-2 rounded-full ${eventNight ? 'bg-emerald-400' : 'bg-[#C8A24C]'}`} aria-hidden />
                <span className="text-[11px] text-white/70">
                  {eventNight ? 'הערב החי עכשיו' : eventEnded ? WEBINAR_CTA_ENDED : 'ערב חי'}, {config.date}, {config.time}
                </span>
                {eventNight || eventEnded ? null : <WebinarCountdown date={config.date} time={config.time} />}
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-heading tracking-tight leading-[1.15] mb-6">
                <span className="text-white block">{headlineParts.line1}</span>
                {headlineParts.line2 ? (
                  <span className="text-gold-gradient font-medium block mt-2">{headlineParts.line2}</span>
                ) : null}
              </h1>

              <p className="text-lg md:text-xl text-white/50 font-light leading-relaxed max-w-2xl mb-5">
                {config.heroSubheadline}
              </p>
              <p className="text-base md:text-lg text-[#F7E7B5] font-medium mb-6">{WEBINAR_PUNCHLINE}</p>
              <p className="text-sm text-white/45 font-light mb-8">
                {config.location}, {config.durationMinutes} דקות, {WEBINAR_AUDIENCE_LABEL}
              </p>

              <div className="flex flex-col items-center gap-3">
                {eventEnded ? (
                  <>
                    <p className="text-base text-[#F7E7B5] font-medium min-h-11 inline-flex items-center">
                      {WEBINAR_CTA_ENDED}
                    </p>
                    <p className="text-sm text-white/45 font-light max-w-md">{WEBINAR_ENDED_NOTE}</p>
                    <Link
                      to="/"
                      className="text-sm text-white/45 hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer transition-colors duration-200"
                    >
                      חזרה לאתר
                    </Link>
                  </>
                ) : eventNight ? (
                  liveEnter.href ? (
                    <a
                      href={liveEnter.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackWebinarCta('hero_enter')}
                      className="inline-flex px-10 py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black font-semibold min-h-11 cursor-pointer hover:opacity-95 transition-opacity duration-200"
                    >
                      {liveEnter.label}
                    </a>
                  ) : (
                    <p className="text-sm text-[#F7E7B5] font-medium min-h-11 inline-flex items-center">
                      {liveEnter.label}
                    </p>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => scrollToForm('hero')}
                    className="inline-flex px-10 py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black font-semibold min-h-11 cursor-pointer hover:opacity-95 transition-opacity duration-200"
                  >
                    {WEBINAR_CTA_PRIMARY}
                  </button>
                )}
                {eventEnded ? null : eventNight ? (
                  <button
                    type="button"
                    onClick={() => scrollToForm('hero_unregistered')}
                    className="text-sm text-white/45 hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer transition-colors duration-200"
                  >
                    {WEBINAR_CTA_NOT_REGISTERED}
                  </button>
                ) : (
                  <a
                    href="#webinar-fit"
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToWebinarFit();
                    }}
                    className="text-sm text-white/45 hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer transition-colors duration-200"
                  >
                    {WEBINAR_CTA_FIT_LINK}
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="problem" className="py-20 md:py-24 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>הבעיה</SectionLabel>
          <SectionTitle>
            הבעיה היא לא שאין לך כישרון.
            <br />
            <span className="text-white/40">הבעיה היא שאין סביבו מערכת.</span>
          </SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">{WEBINAR_HOLDING_LINE}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {WEBINAR_BOTTLENECKS.map((item, index) => {
              const Icon = bottleneckIcons[index];
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[#C8A24C]/20 bg-[#C8A24C]/5 p-5"
                >
                  <Icon className="w-6 h-6 text-[#C8A24C] mb-4" strokeWidth={1.5} aria-hidden />
                  <h3 className="text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 font-light">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="hosts" className="py-20 md:py-24 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>הערב החי</SectionLabel>
          <SectionTitle>לא באים רק ללמוד. באים לבצע.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">
            גל, תמי וגלב בלייב. שיעור מכירות, משימת ביצוע, ואז פעולה שנשלחת לעולם.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {hosts.map((leader) => (
              <article key={leader.name} className="rounded-3xl border border-white/10 overflow-hidden bg-white/[0.02]">
                <div className="aspect-[4/3] overflow-hidden bg-[#0b1020]">
                  <TeamPhoto
                    src={leader.image}
                    name={leader.name}
                    alt={leader.name}
                    className="w-full h-full text-6xl"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl text-white mb-1">{leader.name}</h3>
                  <p className="text-sm text-[#C8A24C] mb-3">{leader.title}</p>
                  <p className="text-sm text-white/50 font-light leading-relaxed">{leader.bio}</p>
                </div>
              </article>
            ))}
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {WEBINAR_TASK_STEPS.map((item, index) => (
              <li key={item.title} className="rounded-3xl border border-[#C8A24C]/20 bg-[#C8A24C]/5 p-5">
                <p className="text-[11px] text-[#C8A24C] mb-3">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 font-light leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ol>
          <p id="tracks" className="text-sm text-[#F7E7B5]/80 font-light leading-relaxed max-w-2xl mx-auto">
            שני מסלולי כניסה לפיילוט, אמיצים והססנים, יוצגו בסוף הערב. לא נדרש להחליט עכשיו.
          </p>
          <p className="mt-3 text-[11px] text-white/35 font-light leading-relaxed">{WEBINAR_TRACKS_FINE_PRINT}</p>
        </div>
      </section>

      <section id="webinar-fit" ref={fitRef} className="py-20 md:py-24 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>התאמה</SectionLabel>
            <SectionTitle>הוובינר הזה מתאים לך אם…</SectionTitle>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_80px_1fr] gap-6 items-stretch">
            <div className="rounded-3xl border border-[#C8A24C]/25 bg-[#C8A24C]/5 p-6 text-right">
              <h3 className="text-lg text-white mb-4 font-light text-center">מתאים אם…</h3>
              <ul className="space-y-3">
                {WEBINAR_FIT_YES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/65 font-light">
                    <Check className="w-4 h-4 text-[#C8A24C] shrink-0 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden lg:flex items-stretch justify-center" aria-hidden>
              <div className="w-px bg-gradient-to-b from-transparent via-[#F7E7B5]/70 to-transparent" />
            </div>
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 text-right">
              <h3 className="text-lg text-white mb-4 font-light text-center">לא מתאים אם…</h3>
              <ul className="space-y-3">
                {WEBINAR_FIT_NO.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/55 font-light">
                    <X className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {eventEnded ? null : (
            <WebinarSectionCta label={WEBINAR_CTA_FIT} section="fit" onClick={() => scrollToForm('fit')} />
          )}
        </div>
      </section>

      <section id="webinar-faq" className="py-20 md:py-24 border-t border-white/[0.04]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <SectionLabel>שאלות</SectionLabel>
            <SectionTitle>שאלות נפוצות</SectionTitle>
          </div>
          <div className="space-y-3">
            {WEBINAR_FAQ.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      <section id="webinar-register-bottom" className="relative py-20 md:py-28 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#010308]/20 to-[#010308]/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,90vw)] h-[240px] bg-[radial-gradient(ellipse_at_center,rgba(200,162,76,0.16),transparent_70%)]" />
        </div>
        <div className="relative z-10 max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-2xl md:text-3xl text-white font-light leading-tight mb-4 max-w-2xl mx-auto">
            זה לא עוד וובינר. זה הצעד שמתחיל מערכת חדשה בחיים שלך.
          </p>
          <p className="text-sm sm:text-base text-[#C8A24C] font-light mb-8">מחכים לך בוובינר. גל, תמי וגלב.</p>
          <aside
            id={WEBINAR_REGISTER_ID}
            aria-label="הרשמה לוובינר"
            className={`${REGISTER_CARD_CLASS} mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-3xl text-start scroll-mt-24`}
          >
            <WebinarRegisterCard
              payload={payload}
              formId={`${WEBINAR_REGISTER_ID}-form`}
              headlineParts={headlineParts}
            />
          </aside>
          <p className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#C8A24C]/80 font-light mt-8">
            <Link to="/terms" className="hover:text-[#F7E7B5] min-h-11 inline-flex items-center">
              תנאי שימוש
            </Link>
            <Link to="/privacy" className="hover:text-[#F7E7B5] min-h-11 inline-flex items-center">
              פרטיות
            </Link>
            <Link to="/accessibility" className="hover:text-[#F7E7B5] min-h-11 inline-flex items-center">
              נגישות
            </Link>
          </p>
        </div>
      </section>

      {eventEnded ? null : (
        <WebinarStickyCta
          date={config.date}
          time={config.time}
          registrationCount={payload.registrationCount}
          eventNight={eventNight}
          zoomLink={config.zoomLink}
          whatsappGroupUrl={config.whatsappGroupUrl}
        />
      )}
    </div>
  );
}
