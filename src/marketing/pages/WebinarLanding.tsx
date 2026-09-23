import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, X } from 'lucide-react';
import { webinarApi } from '../../api/webinar';
import {
  DEFAULT_WEBINAR_CONFIG,
  WEBINAR_FAQ,
  splitHeroHeadline,
  type WebinarPublicPayload,
} from '../../constants/webinar';
import {
  WEBINAR_BOTTLENECKS,
  WEBINAR_CTA_ENDED,
  WEBINAR_CTA_REGISTER,
  WEBINAR_CTA_NEXT_CYCLE,
  WEBINAR_ENDED_NOTE,
  WEBINAR_FIT_NO,
  WEBINAR_FIT_YES,
  WEBINAR_GLEB,
  WEBINAR_HOLDING_LINE,
  WEBINAR_REGISTER_ID,
  WEBINAR_TASK_STEPS,
  WEBINAR_TRACKS_FINE_PRINT,
} from '../../constants/webinarPage';
import { WebinarRegistrationForm } from '../components/WebinarRegistrationForm';
import { WebinarStickyCta } from '../components/WebinarStickyCta';
import { WebinarSectionCta } from '../components/WebinarSocialProof';
import { trackEvent, trackWebinarCta, scrollToWebinarForm } from '../../utils/analytics';
import { captureUtmFromSearch } from '../../utils/utm';
import { getWebinarPhase } from '../../utils/webinarTime';
import { TeamPhoto } from '../../components/TeamPhoto';
import { TeamGalaxy } from '../components/galaxy/TeamGalaxy';
import { NeuralChevron, WebinarNeuralHero } from '../components/WebinarNeuralHero';
import './WebinarLanding.css';
import './WebinarEditorialCinema.css';
import '../components/WebinarNeuralHero.css';
import './WebinarNeuralSlides.css';

function FaqItem({ q, a, ...props }: { q: string; a: string } & HTMLAttributes<HTMLDetailsElement>) {
  return (
    <details {...props} className="group glass-card p-5">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-white font-light min-h-11">
        <span>{q}</span>
        <ChevronDown className="w-4 h-4 text-[#b79043] group-open:rotate-180 transition-transform duration-200 shrink-0" />
      </summary>
      <p className="mt-4 text-sm text-white/50 font-light leading-relaxed">{a}</p>
    </details>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.25em] text-[#b79043] mb-4">{children}</p>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-3xl md:text-5xl font-heading text-white mb-6 leading-tight mx-auto max-w-3xl">{children}</h2>;
}

const REGISTER_CARD_CLASS =
  'glass-card shadow-2xl shadow-black/40 p-5 sm:p-8 lg:p-10';

function HostFaces() {
  const hosts = [
    { name: 'גל', src: '/team/gal.png' },
    { name: 'תמי', src: '/team/tami.png' },
    { name: 'גלב', src: WEBINAR_GLEB.photo },
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
              className="w-[72px] h-[72px] rounded-full border-2 border-[#b79043] text-base"
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
      image: WEBINAR_GLEB.photo,
    },
  ];

  return (
    <div className="webinar-stage-page w-full pb-28">
      <nav className="webinar-section-nav" aria-label="ניווט בתוך עמוד הוובינר">
        <a href="#webinar-fit">למי זה</a>
        <a href="#webinar-register">{eventEnded ? 'המחזור הבא' : 'הרשמה'}</a>
        <a href="#webinar-faq">שאלות</a>
      </nav>
      <div className="webinar-neural-overture">
      <WebinarNeuralHero
        config={config}
        headlineParts={headlineParts}
        eventNight={eventNight}
        eventEnded={eventEnded}
        onRegister={scrollToForm}
      />

      <section id="problem" className="webinar-neural-afterglow">
        <span className="webinar-neural-stem" aria-hidden="true" />
        <div className="webinar-neural-plate">
          <SectionLabel>הבעיה</SectionLabel>
          <SectionTitle>
            הבעיה היא לא שאין לך כישרון.
            <br />
            <span>הבעיה היא שאין סביבו מערכת.</span>
          </SectionTitle>
          <p className="webinar-neural-hold">{WEBINAR_HOLDING_LINE}</p>
          <ul className="webinar-neural-bottlenecks">
            {WEBINAR_BOTTLENECKS.map((item) => (
              <li key={item.title}>
                <NeuralChevron />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </div>

      <div className="webinar-editorial-grid">
      <section id="hosts" className="webinar-neural-slide">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>הערב החי</SectionLabel>
          <SectionTitle>לא באים רק ללמוד. באים לבצע.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">
            גל, תמי וגלב בלייב. שיעור מכירות, משימת ביצוע, ואז פעולה שנשלחת לעולם.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {hosts.map((leader) => (
              <article key={leader.name} className="glass-card overflow-hidden">
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
                  <p className="text-sm text-[#b79043] mb-3">{leader.title}</p>
                  <p className="text-sm text-white/50 font-light leading-relaxed">{leader.bio}</p>
                </div>
              </article>
            ))}
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {WEBINAR_TASK_STEPS.map((item, index) => (
              <li key={item.title} className="glass-card p-5">
                <p className="text-[11px] text-[#b79043] mb-3">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 font-light leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ol>
          <p id="tracks" className="text-sm text-[#dfc47d]/80 font-light leading-relaxed max-w-2xl mx-auto">
            שני מסלולי כניסה לפיילוט, אמיצים והססנים, יוצגו בסוף הערב. לא נדרש להחליט עכשיו.
          </p>
          <p className="mt-3 text-[11px] text-white/35 font-light leading-relaxed">{WEBINAR_TRACKS_FINE_PRINT}</p>
        </div>
      </section>

      <TeamGalaxy />

      <section id="webinar-fit" ref={fitRef} className="webinar-neural-slide">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>התאמה</SectionLabel>
            <SectionTitle>הוובינר הזה מתאים לך אם…</SectionTitle>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_80px_1fr] gap-6 items-stretch">
            <div className="glass-card p-6 text-right">
              <h3 className="text-lg text-white mb-4 font-light text-center">מתאים אם…</h3>
              <ul className="space-y-3">
                {WEBINAR_FIT_YES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/65 font-light">
                    <Check className="w-4 h-4 text-[#b79043] shrink-0 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden lg:flex items-stretch justify-center" aria-hidden>
              <div className="w-px bg-gradient-to-b from-transparent via-[#dfc47d]/70 to-transparent" />
            </div>
            <div className="glass-card p-6 text-right">
              <h3 className="text-lg text-white mb-4 font-light text-center">לא מתאים אם…</h3>
              <ul className="space-y-3">
                {WEBINAR_FIT_NO.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/55 font-light">
                    <X className="w-4 h-4 text-[#dfc47d] shrink-0 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {eventEnded ? null : (
            <WebinarSectionCta label={WEBINAR_CTA_REGISTER} section="fit" onClick={() => scrollToForm('fit')} />
          )}
        </div>
      </section>

      <section id="webinar-faq" className="webinar-neural-slide">
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

      <section id="webinar-register-bottom" className="webinar-neural-slide relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0b08]/20 to-[#0d0b08]/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,90vw)] h-[240px] bg-[radial-gradient(ellipse_at_center,rgba(183, 144, 67,0.16),transparent_70%)]" />
        </div>
        <div className="relative z-10 max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {eventEnded ? (
            <div id={WEBINAR_REGISTER_ID} className="scroll-mt-24">
              <p className="text-2xl md:text-3xl text-white font-light leading-tight mb-4 max-w-2xl mx-auto">
                {WEBINAR_CTA_ENDED}
              </p>
              <p className="text-sm sm:text-base text-white/70 font-light mb-8">{WEBINAR_ENDED_NOTE}</p>
              <Link to="/pricing" className="btn-gold text-black">{WEBINAR_CTA_NEXT_CYCLE}</Link>
            </div>
          ) : (
            <>
          <p className="text-2xl md:text-3xl text-white font-light leading-tight mb-4 max-w-2xl mx-auto">
            זה לא עוד וובינר. זה הצעד שמתחיל מערכת חדשה בחיים שלך.
          </p>
          <p className="text-sm sm:text-base text-[#b79043] font-light mb-8">מחכים לך בוובינר. גל, תמי וגלב.</p>
          <aside
            id={WEBINAR_REGISTER_ID}
            aria-label="הרשמה לוובינר"
            className={`${REGISTER_CARD_CLASS} webinar-stage-register-card mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-3xl text-start scroll-mt-24`}
          >
            <WebinarRegisterCard
              payload={payload}
              formId={`${WEBINAR_REGISTER_ID}-form`}
              headlineParts={headlineParts}
            />
          </aside>
            </>
          )}
          <p className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#b79043]/80 font-light mt-8">
            <Link to="/terms" className="hover:text-[#dfc47d] min-h-11 inline-flex items-center">
              תנאי שימוש
            </Link>
            <Link to="/privacy" className="hover:text-[#dfc47d] min-h-11 inline-flex items-center">
              פרטיות
            </Link>
            <Link to="/accessibility" className="hover:text-[#dfc47d] min-h-11 inline-flex items-center">
              נגישות
            </Link>
          </p>
        </div>
      </section>
      </div>

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
