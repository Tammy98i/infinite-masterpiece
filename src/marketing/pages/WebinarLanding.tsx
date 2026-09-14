import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ChevronDown, Crosshair, Layers, TrendingUp, Users, X } from 'lucide-react';
import { webinarApi } from '../../api/webinar';
import {
  DEFAULT_WEBINAR_CONFIG,
  splitHeroHeadline,
  type WebinarPublicPayload,
} from '../../constants/webinar';
import {
  WEBINAR_AUDIENCE_LABEL,
  WEBINAR_CTA_ENDED,
  WEBINAR_PUNCHLINE,
  WEBINAR_REGISTER_ID,
  WEBINAR_TASK_STEPS,
  WEBINAR_TRACKS_FINE_PRINT,
  webinarLiveEnter,
} from '../../constants/webinarPage';
import {
  WEBINAR_BUILD_BRIDGE,
  WEBINAR_BUILD_TOGETHER,
  WEBINAR_FAQ_PREVIEW_COUNT,
  WEBINAR_FIT_NO_SHORT,
  WEBINAR_FIT_YES_SHORT,
  webinarCopy,
  webinarFaqForPhase,
} from '../../constants/webinarPhaseCopy';
import { WebinarRegistrationForm } from '../components/WebinarRegistrationForm';
import { WebinarStickyCta } from '../components/WebinarStickyCta';
import { WebinarSectionCta } from '../components/WebinarSocialProof';
import { WebinarCountdown } from '../components/WebinarCountdown';
import { trackEvent, trackWebinarCta, scrollToWebinarForm, scrollToWebinarFit } from '../../utils/analytics';
import { captureUtmFromSearch } from '../../utils/utm';
import { getWebinarPhase } from '../../utils/webinarTime';
import { teamMembersApi, type TeamMember } from '../../api/teamMembers';
import {
  TEAM_SECTION_DEFAULTS,
  teamGalaxyPublicMembers,
  type TeamSectionSettings,
} from '../../constants/teamGalaxySeed';
import { fillHostsLead, hostCard, hostFirstName, joinHebrewNames, webinarHosts } from '../../constants/webinarHosts';
import { TeamPhoto } from '../../components/TeamPhoto';
import { TeamGalaxy } from '../components/TeamGalaxy/TeamGalaxy';

const buildIcons = [Crosshair, Layers, Users, TrendingUp];

function FaqItem({ q, a, ...props }: { q: string; a: string } & HTMLAttributes<HTMLDetailsElement>) {
  return (
    <details {...props} className="group rounded-3xl border border-white/10 bg-[#07070c]/80 px-5">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-white font-light min-h-[4.25rem] py-3 text-[16px]">
        <span>{q}</span>
        <ChevronDown className="w-5 h-5 text-[#C8A24C] group-open:rotate-180 transition-transform duration-200 shrink-0" aria-hidden />
      </summary>
      <p className="pb-5 text-[16px] text-white/75 font-light leading-relaxed">{a}</p>
    </details>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.25em] text-[#C8A24C] mb-3">{children}</p>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[28px] md:text-4xl font-heading text-white mb-4 leading-tight mx-auto max-w-[720px] tracking-normal">
      {children}
    </h2>
  );
}

const REGISTER_CARD_CLASS = 'rounded-3xl border border-[#C8A24C]/25 bg-[#07070c]/80 p-5 sm:p-8 lg:p-10';

function HostFaces({ live, members }: { live: boolean; members: TeamMember[] }) {
  const hosts = webinarHosts(members).map(hostCard);
  const names = joinHebrewNames(webinarHosts(members).map((member) => hostFirstName(member)));
  if (!hosts.length) return null;
  return (
    <div className="flex items-center justify-center gap-3 mb-5 sm:mb-6">
      <div className="flex -space-x-3 space-x-reverse sm:-space-x-4">
        {hosts.map((host) => (
          <span key={host.id} className="inline-flex">
            <TeamPhoto
              src={host.image}
              name={host.name}
              alt={host.alt}
              className="w-[72px] h-[72px] rounded-full border-2 border-[#C8A24C] text-base"
            />
          </span>
        ))}
      </div>
      <p className="text-xs sm:text-sm text-white/60 font-light">{live ? `${names} בלייב` : names}</p>
    </div>
  );
}

export function WebinarLanding() {
  const location = useLocation();
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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => teamGalaxyPublicMembers() as TeamMember[]);
  const [teamSettings, setTeamSettings] = useState<TeamSectionSettings>(TEAM_SECTION_DEFAULTS);
  const [configReady, setConfigReady] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState(false);

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
    teamMembersApi
      .publicSection('he')
      .then((res) => {
        if (res.members?.length) setTeamMembers(res.members);
        if (res.settings) setTeamSettings({ ...TEAM_SECTION_DEFAULTS, ...res.settings });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const fromPath = location.pathname.includes('/webinar-people');
    const fromHash = location.hash.replace('#', '') === 'webinar-people';
    if (!fromPath && !fromHash) return;
    const timer = window.setTimeout(() => {
      document.getElementById('webinar-people')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const node = fitRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (fitTracked.current || !entries.some((entry) => entry.isIntersecting)) return;
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
  const eventPhase = configReady
    ? getWebinarPhase(config.date, config.time, config.durationMinutes, now)
    : 'upcoming';
  const copy = webinarCopy(eventPhase);
  const hosts = webinarHosts(teamMembers).map(hostCard);
  const hostsLead = fillHostsLead(copy.hostsLead, teamMembers);
  const faqs = webinarFaqForPhase(eventPhase);
  const visibleFaqs = faqExpanded ? faqs : faqs.slice(0, WEBINAR_FAQ_PREVIEW_COUNT);
  const cmsHeadline = splitHeroHeadline(activeHeadline);
  const headlineParts = copy.heroHeadline
    ? splitHeroHeadline(copy.heroHeadline)
    : cmsHeadline;
  const eventNight = eventPhase === 'live';
  const eventEnded = eventPhase === 'ended';
  const liveEnter = webinarLiveEnter(config.zoomLink, config.whatsappGroupUrl);

  const scrollToForm = (section = 'hero') => {
    trackWebinarCta(section);
    scrollToWebinarForm();
  };

  const heroCta = () => {
    if (eventEnded) {
      return (
        <>
          <button type="button" onClick={() => scrollToForm('hero')} className="btn-gold text-black px-10 py-4">
            {copy.primaryCta}
          </button>
          <p className="text-sm text-white/60 font-light max-w-md text-center">{copy.heroMicro}</p>
        </>
      );
    }
    if (eventNight) {
      return liveEnter.href ? (
        <a
          href={liveEnter.href}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackWebinarCta('hero_enter')}
          className="btn-gold text-black px-10 py-4"
        >
          {liveEnter.label}
        </a>
      ) : (
        <p className="text-sm text-[#F7E7B5] font-medium min-h-11 inline-flex items-center">{liveEnter.label}</p>
      );
    }
    return (
      <button type="button" onClick={() => scrollToForm('hero')} className="btn-gold text-black px-10 py-4">
        {copy.primaryCta}
      </button>
    );
  };

  return (
    <div className="w-full pb-28">
      <section id="webinar-hero" className="relative flex items-center pt-8 pb-12 md:pt-12 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#010308]/30 via-transparent to-[#010308]/40" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center flex flex-col items-center"
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 rounded-full border border-[#C8A24C]/50 bg-[#C8A24C]/15 mb-6">
              <span className={`w-2 h-2 rounded-full ${eventNight ? 'bg-emerald-400' : 'bg-[#C8A24C]'}`} aria-hidden />
              <span className="text-[11px] text-[#F7E7B5] font-medium">
                {eventNight ? 'הערב החי עכשיו' : eventEnded ? WEBINAR_CTA_ENDED : 'ערב חי'}
                {eventEnded ? '' : `, ${config.date}, ${config.time}`}
              </span>
              {eventNight || eventEnded ? null : <WebinarCountdown date={config.date} time={config.time} />}
            </div>

            <h1 className="text-[30px] sm:text-[34px] md:text-6xl xl:text-7xl font-heading tracking-tight leading-[1.18] mb-4 md:mb-6 max-w-[18ch] md:max-w-none">
              <span className="text-white block">{headlineParts.line1}</span>
              {headlineParts.line2 ? (
                <span className="text-gold-gradient font-medium block mt-2">{headlineParts.line2}</span>
              ) : null}
            </h1>

            <p className="text-[16px] md:text-xl text-white/70 font-light leading-relaxed max-w-[720px] mb-4">
              {copy.heroSubheadline || config.heroSubheadline}
            </p>
            {eventEnded ? null : (
              <>
                <p className="text-sm md:text-lg text-[#F7E7B5] font-medium mb-3">{WEBINAR_PUNCHLINE}</p>
                <p className="text-sm text-white/55 font-light mb-6">
                  {config.location}, {config.durationMinutes} דקות, {WEBINAR_AUDIENCE_LABEL}
                </p>
              </>
            )}

            <div className="flex flex-col items-center gap-3 mt-2">
              {heroCta()}
              {eventEnded ? null : eventNight ? (
                <button
                  type="button"
                  onClick={() => scrollToForm('hero_unregistered')}
                  className="text-sm text-white/55 hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer"
                >
                  {copy.fitLink}
                </button>
              ) : (
                <a
                  href="#webinar-fit"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToWebinarFit();
                  }}
                  className="text-sm text-white/55 hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer"
                >
                  {copy.fitLink}
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="problem" className="relative py-12 md:py-20 bg-[#07070c]/86">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>מה בונים יחד</SectionLabel>
          <SectionTitle>
            הבעיה היא לא שאין לך כישרון.
            <br />
            <span className="text-white/45">הבעיה היא שאין סביבו מערכת.</span>
          </SectionTitle>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {WEBINAR_BUILD_TOGETHER.map((item, index) => {
              const Icon = buildIcons[index];
              return (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 text-right">
                  <p className="text-[11px] text-[#C8A24C] mb-2">{String(index + 1).padStart(2, '0')}</p>
                  <Icon className="w-6 h-6 text-[#C8A24C] mb-3" strokeWidth={1.5} aria-hidden />
                  <h3 className="text-white mb-1">{item.title}</h3>
                  <p className="text-[16px] text-white/65 font-light">{item.text}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[16px] text-[#F7E7B5] font-light mt-8 max-w-[720px] mx-auto">{WEBINAR_BUILD_BRIDGE}</p>
        </div>
      </section>

      <section id="hosts" className="py-12 md:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>{copy.hostsLabel}</SectionLabel>
          <SectionTitle>לא באים רק ללמוד. באים לבצע.</SectionTitle>
          <p className="text-white/65 font-light leading-relaxed max-w-[720px] mx-auto mb-8 text-[16px]">{hostsLead}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10 items-stretch">
            {hosts.map((leader) => (
              <article key={leader.id} className="rounded-3xl border border-white/10 bg-[#07070c]/70 overflow-hidden flex flex-col h-full">
                <div className="aspect-[4/3] overflow-hidden bg-[#0b1020]">
                  <TeamPhoto src={leader.image} name={leader.name} alt={leader.alt} className="w-full h-full text-6xl" />
                </div>
                <div className="p-5 text-center flex-1">
                  <h3 className="text-xl text-white mb-1">{leader.name}</h3>
                  <p className="text-sm text-[#C8A24C] mb-3 line-clamp-2 min-h-[2.5rem]">{leader.title}</p>
                  <p className="text-[16px] text-white/65 font-light leading-relaxed line-clamp-3">{leader.bio}</p>
                </div>
              </article>
            ))}
          </div>
          <h3 className="text-xl md:text-2xl font-heading text-white mb-6">{copy.stepsTitle}</h3>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {WEBINAR_TASK_STEPS.map((item, index) => (
              <li key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-right">
                <p className="text-[11px] text-[#C8A24C] mb-2">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-white mb-2">{item.title}</h3>
                <p className="text-[16px] text-white/65 font-light leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-white/50 font-light leading-relaxed max-w-[720px] mx-auto">{WEBINAR_TRACKS_FINE_PRINT}</p>
        </div>
      </section>

      <TeamGalaxy preview={{ settings: teamSettings, members: teamMembers }} />

      <section id="webinar-fit" ref={fitRef} className="relative py-12 md:py-20 bg-[#07070c]/86">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <SectionLabel>התאמה</SectionLabel>
            <SectionTitle>למי זה מתאים</SectionTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            <div className="rounded-3xl border border-[#C8A24C]/30 bg-[#C8A24C]/8 p-6 text-right">
              <h3 className="text-lg text-white mb-4 font-light text-center">מתאים לך אם…</h3>
              <ul className="space-y-3">
                {WEBINAR_FIT_YES_SHORT.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[16px] text-white/80 font-light">
                    <Check className="w-5 h-5 text-[#C8A24C] shrink-0 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-rose-400/25 bg-black/35 p-6 text-right">
              <h3 className="text-lg text-white mb-4 font-light text-center">פחות מתאים אם…</h3>
              <ul className="space-y-3">
                {WEBINAR_FIT_NO_SHORT.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[16px] text-white/75 font-light">
                    <X className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <WebinarSectionCta label={copy.fitCta} section="fit" onClick={() => scrollToForm('fit')} />
        </div>
      </section>

      <section id="webinar-faq" className="relative py-12 md:py-20 bg-[#07070c]/86">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <SectionLabel>שאלות</SectionLabel>
            <SectionTitle>שאלות נפוצות</SectionTitle>
          </div>
          <div className="space-y-3">
            {visibleFaqs.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
          {faqs.length > WEBINAR_FAQ_PREVIEW_COUNT ? (
            <button
              type="button"
              className="mt-5 mx-auto block text-[16px] text-[#C8A24C] min-h-11"
              onClick={() => setFaqExpanded((open) => !open)}
              aria-expanded={faqExpanded}
            >
              {faqExpanded ? 'הסתרת שאלות נוספות' : 'הצגת שאלות נוספות'}
            </button>
          ) : null}
        </div>
      </section>

      <section id="webinar-register-bottom" className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,90vw)] h-[240px] bg-[radial-gradient(ellipse_at_center,rgba(200,162,76,0.14),transparent_70%)]" />
        </div>
        <div className="relative z-10 max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <aside
            id={WEBINAR_REGISTER_ID}
            aria-label={copy.registerAria}
            className={`${REGISTER_CARD_CLASS} mx-auto w-full max-w-xl md:max-w-2xl text-start scroll-mt-24`}
          >
            <HostFaces live={eventNight} members={teamMembers} />
            <WebinarRegistrationForm
              payload={payload}
              formId={`${WEBINAR_REGISTER_ID}-form`}
              waitlist={copy.waitlistMode || payload.isWaitlist}
              copy={{
                eyebrow: copy.formEyebrow,
                title: copy.formTitle,
                submit: copy.formSubmit,
                trust: copy.formTrust,
              }}
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

      <WebinarStickyCta
        date={config.date}
        time={config.time}
        registrationCount={payload.registrationCount}
        phase={eventPhase}
        zoomLink={config.zoomLink}
        whatsappGroupUrl={config.whatsappGroupUrl}
        ctaLabel={copy.stickyCta}
        ctaLabelShort={copy.stickyCtaShort}
      />
    </div>
  );
}
