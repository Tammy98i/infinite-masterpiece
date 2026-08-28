import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Check,
  ChevronDown,
  Compass,
  Handshake,
  Infinity,
  Megaphone,
  Network,
  Radio,
  Scale,
  Shield,
  Sparkles,
  Tag,
  Target,
  Users,
  X,
} from 'lucide-react';
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
  WEBINAR_CTA_FAQ,
  WEBINAR_CTA_FIT,
  WEBINAR_CTA_FIT_LINK,
  WEBINAR_CTA_PRIMARY,
  WEBINAR_DIFFERENCE_POINTS,
  WEBINAR_ECOSYSTEM,
  WEBINAR_FIT_NO,
  WEBINAR_FIT_YES,
  WEBINAR_GLEB,
  WEBINAR_HOLDING_LINE,
  WEBINAR_PILOT_DAYS,
  WEBINAR_PUNCHLINE,
  WEBINAR_SALES_PRINCIPLES,
  WEBINAR_TASK_STEPS,
  WEBINAR_TIMELINE,
  WEBINAR_TRACKS_FINE_PRINT,
  WEBINAR_TRANSPARENCY_POINTS,
  WEBINAR_VALUE_CHAIN,
} from '../../constants/webinarPage';
import { WebinarRegistrationForm } from '../components/WebinarRegistrationForm';
import { WebinarStickyCta } from '../components/WebinarStickyCta';
import { WebinarExitIntent } from '../components/WebinarExitIntent';
import { WebinarSocialProof, WebinarSectionCta, WebinarTrustStrip } from '../components/WebinarSocialProof';
import { WebinarCountdown } from '../components/WebinarCountdown';
import { trackEvent, trackWebinarCta, scrollToWebinarForm, scrollToWebinarFit } from '../../utils/analytics';
import { captureUtmFromSearch } from '../../utils/utm';
import { TeamPhoto } from '../../components/TeamPhoto';

const bottleneckIcons = [Tag, Handshake, Megaphone, Network, Target];
const ecosystemIcons = [Radio, Users, Sparkles, Compass, Infinity, Shield];

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
  'rounded-3xl border border-[#C8A24C]/30 bg-[#010308]/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/40';

function HostFaces() {
  const hosts = [
    { name: 'גל', src: '/team/gal.png' },
    { name: 'תמי', src: '/team/tami.png' },
    { name: 'גלב', src: '/team/gleb.png' },
  ];
  return (
    <div className="flex items-center justify-center gap-3 mb-5">
      <div className="flex -space-x-3 space-x-reverse">
        {hosts.map((host) => (
          <span key={host.name} className="inline-flex">
            <TeamPhoto
              src={host.src}
              name={host.name}
              alt={host.name}
              className="w-9 h-9 rounded-full border border-[#C8A24C]/50 text-[11px]"
            />
          </span>
        ))}
      </div>
      <p className="text-xs text-white/50 font-light">גל, תמי וגלב בלייב</p>
    </div>
  );
}

function WebinarRegisterCard({
  payload,
  formId,
  headlineParts,
  headlineVisible = 'always',
}: {
  payload: WebinarPublicPayload;
  formId: string;
  headlineParts: { line1: string; line2: string };
  headlineVisible?: 'always' | 'until-xl';
}) {
  return (
    <>
      <p
        className={`${headlineVisible === 'until-xl' ? 'xl:hidden ' : ''}text-lg text-white font-light leading-snug mb-4`}
      >
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

function GoldCard({
  children,
  className = '',
  ...props
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`rounded-3xl border border-[#C8A24C]/20 bg-[#C8A24C]/5 p-6 ${className}`}>
      {children}
    </div>
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

  useEffect(() => {
    captureUtmFromSearch(window.location.search);
    trackEvent('webinar_page_view');
    webinarApi
      .config()
      .then((res) => setPayload(res))
      .catch(() => undefined);
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

  const scrollToForm = (section = 'hero') => {
    trackWebinarCta(section);
    scrollToWebinarForm();
  };

  return (
    <div className="w-full pb-28">
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#010308] via-[#010308]/90 to-[#010308]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[min(900px,90vw)] h-[320px] bg-[radial-gradient(ellipse_at_center,rgba(200,162,76,0.22),transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,380px)_1fr] gap-10 xl:gap-14 items-start">
            <motion.aside
              id="webinar-register-hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`order-1 ${REGISTER_CARD_CLASS}`}
            >
              <WebinarRegisterCard
                payload={payload}
                formId="webinar-register-hero"
                headlineParts={headlineParts}
                headlineVisible="until-xl"
              />
            </motion.aside>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="order-2 text-center flex flex-col items-center"
            >
              <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 rounded-full bg-white/[0.03] border border-[#C8A24C]/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#C8A24C]" aria-hidden />
                <span className="text-[11px] text-white/70">ערב חי, {config.date}, {config.time}</span>
                <WebinarCountdown date={config.date} time={config.time} />
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
                <button
                  type="button"
                  onClick={() => scrollToForm('hero')}
                  className="hidden xl:inline-flex px-10 py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black font-semibold min-h-11 cursor-pointer hover:opacity-95 transition-opacity duration-200"
                >
                  {WEBINAR_CTA_PRIMARY}
                </button>
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
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="why-different" className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>למה זה שונה</SectionLabel>
          <SectionTitle>הערב הזה הוא ניסוי חי. לא עוד שידור השראה.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-4">
            לא מציגים מוצר מהצד. בונים אותו מולכם, מלמדים, מבצעים ומקשיבים. בסוף הערב יש פעולה שנשלחה, לא רעיון במחברת.
          </p>
          <p className="text-lg text-[#F7E7B5] font-medium leading-relaxed max-w-3xl mx-auto mb-10">{WEBINAR_HOLDING_LINE}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {WEBINAR_DIFFERENCE_POINTS.map((item) => (
              <GoldCard key={item.title}>
                <h3 className="text-white text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-white/50 font-light leading-relaxed">{item.text}</p>
              </GoldCard>
            ))}
          </div>
          <WebinarSectionCta label={WEBINAR_CTA_PRIMARY} section="difference" onClick={() => scrollToForm('difference')} />
        </div>
      </section>

      {config.socialProofQuotes.length ? (
        <section className="py-12 border-t border-white/[0.04]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionLabel>למה נרשמים</SectionLabel>
            <p className="text-xs text-white/35 font-light mb-4">קולות לפני הערב. לא הבטחת תוצאה.</p>
            <WebinarSocialProof quotes={config.socialProofQuotes} />
          </div>
        </section>
      ) : null}

      <section id="problem" className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>הבעיה</SectionLabel>
          <SectionTitle>
            הבעיה היא לא שאין לך כישרון.
            <br />
            <span className="text-white/40">הבעיה היא שאין סביבו מערכת.</span>
          </SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">
            הרבה יוצרים יודעים ליצור, ללמד, להדריך, להופיע, לעצב, לטפל או להעביר ערך. כשצריך להפוך את הערך הזה
            להצעה, שיחה, מכירה, תמחור ומערכת שיווק, שם הרבה אנשים נתקעים. הערב הזה נבנה בדיוק בשביל הנקודה הזו.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {WEBINAR_BOTTLENECKS.map((item, index) => {
              const Icon = bottleneckIcons[index];
              return (
                <GoldCard key={item.title} className="p-5">
                  <Icon className="w-6 h-6 text-[#C8A24C] mb-4" strokeWidth={1.5} aria-hidden />
                  <h3 className="text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 font-light">{item.text}</p>
                </GoldCard>
              );
            })}
          </div>
        </div>
      </section>

      <section id="why-now" className="py-20 md:py-28 bg-white/[0.01] border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>למה עכשיו</SectionLabel>
          <SectionTitle>היצירה היא כבר שוק. השאלה היא אם יש לך מערכת.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-4">
            הכלכלה היצירתית גדלה. הביקוש לתוכן, ידע, מדיה, עיצוב, חוויה, יצירה וטכנולוגיה רק מתרחב. ליוצר הבודד
            אין אוטומטית מנגנון שממיר את הביקוש הזה להכנסה יציבה.
          </p>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">
            לכן השאלה היא לא אם יש ערך ליצירה שלך. השאלה היא האם הערך מחובר להצעה, לקהל, לשיחה, למכירה ולמערכת שחוזרת
            על עצמה.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {WEBINAR_VALUE_CHAIN.map((item, index) => (
              <div key={item} className="flex items-center gap-2 md:gap-3">
                <span className="rounded-full border border-[#C8A24C]/30 bg-[#C8A24C]/10 px-4 py-2 text-sm text-[#F7E7B5]">
                  {item}
                </span>
                {index < WEBINAR_VALUE_CHAIN.length - 1 ? (
                  <span className="text-[#C8A24C]/70" aria-hidden>
                    ←
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="timeline" className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>150 דקות</SectionLabel>
          <SectionTitle>150 דקות. מסע אחד שלם.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-8">
            הוובינר בנוי כמסע חי: שיעור מכירות, משימת ביצוע, צוות, שקיפות והזמנה לפיילוט. לא יושבים ומקשיבים. מבצעים.
          </p>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {WEBINAR_TIMELINE.slice(0, 4).map((item, index) => (
              <li key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-[11px] text-[#C8A24C] mb-3">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-white text-base mb-2">{item.title}</h3>
                <p className="text-sm text-white/45 font-light leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-white/40 font-light mb-2">גם בערב:</p>
          <ul className="flex flex-wrap gap-2 mb-4">
            {WEBINAR_TIMELINE.slice(4).map((item) => (
              <li
                key={item.title}
                className="rounded-full border border-[#C8A24C]/25 bg-[#C8A24C]/5 px-4 py-2 text-xs text-[#F7E7B5]"
              >
                {item.title}
              </li>
            ))}
          </ul>
          <WebinarSectionCta label={WEBINAR_CTA_PRIMARY} section="timeline" onClick={() => scrollToForm('timeline')} />
        </div>
      </section>

      <section id="sales" className="py-20 md:py-28 bg-white/[0.01] border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>שיעור המכירות</SectionLabel>
          <SectionTitle>מכירות בלי לאבד את עצמך.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">
            בוובינר נלמד מכירות בגישה הוליסטית ואתית. לא לחץ, לא מניפולציה, לא הבטחות שווא. אבחון, התאמה, בהירות,
            ערך וצעד הבא שאפשר לקחת הערב.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {WEBINAR_SALES_PRINCIPLES.slice(0, 4).map((item) => (
              <GoldCard key={item} className="p-5">
                <p className="text-white text-sm leading-relaxed">{item}</p>
              </GoldCard>
            ))}
          </div>
          <ul className="flex flex-wrap gap-2">
            {WEBINAR_SALES_PRINCIPLES.slice(4).map((item) => (
              <li key={item} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/50">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="execution" className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>משימת ביצוע</SectionLabel>
          <SectionTitle>לא באים רק ללמוד. באים לבצע.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-4">
            במהלך הוובינר תהיה משימת ביצוע חיה. תנסחו הצעה, תבחרו אדם אחד מתאים, תשלחו פעולה אמיתית, ותתעדו מה קרה.
          </p>
          <p className="text-white/70 font-medium mb-10">לא טיוטה יפה. לא מחשבה לעתיד. אות אמיתי שנשלח לעולם.</p>
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WEBINAR_TASK_STEPS.map((item, index) => (
              <li key={item.title} className="rounded-3xl border border-[#C8A24C]/20 bg-[#C8A24C]/5 p-5">
                <p className="text-[11px] text-[#C8A24C] mb-3">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 font-light leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="webinar-fit" ref={fitRef} className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionLabel>התאמה</SectionLabel>
            <SectionTitle>הוובינר הזה מתאים לך אם…</SectionTitle>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_80px_1fr] gap-6 items-stretch">
            <div className="rounded-3xl border border-[#C8A24C]/25 bg-[#C8A24C]/5 p-6 text-center">
              <h3 className="text-lg text-white mb-4 font-light">מתאים אם…</h3>
              <ul className="space-y-3">
                {WEBINAR_FIT_YES.map((item) => (
                  <li key={item} className="flex items-start justify-center gap-3 text-sm text-white/65 font-light">
                    <Check className="w-4 h-4 text-[#C8A24C] shrink-0 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden lg:flex items-stretch justify-center" aria-hidden>
              <div className="w-px bg-gradient-to-b from-transparent via-[#F7E7B5]/70 to-transparent" />
            </div>
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
              <h3 className="text-lg text-white mb-4 font-light">לא מתאים אם…</h3>
              <ul className="space-y-3">
                {WEBINAR_FIT_NO.map((item) => (
                  <li key={item} className="flex items-start justify-center gap-3 text-sm text-white/55 font-light">
                    <X className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <WebinarSectionCta label={WEBINAR_CTA_FIT} section="fit" onClick={() => scrollToForm('fit')} />
        </div>
      </section>

      <section id="hosts" className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>הצוות</SectionLabel>
          <SectionTitle>הצוות אינו תפאורה. הוא המערכת.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-12">
            גל, תמי, גלב ועוד 20 שותפים בונים יחד את האקוסיסטם. שיווק, תוכן, קהילה, פרויקט, מכירות, טכנולוגיה ושירות.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
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
            ].map((leader) => (
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
                  <p className="text-sm text-[#C8A24C] mb-4">{leader.title}</p>
                  <p className="text-sm text-white/50 font-light leading-relaxed">{leader.bio}</p>
                </div>
              </article>
            ))}
          </div>
          <Link
            to="/premium-88"
            className="mt-8 inline-flex items-center justify-center px-8 py-3 rounded-full border border-[#C8A24C]/40 text-[#F7E7B5] text-sm min-h-11 cursor-pointer hover:border-[#F7E7B5] transition-colors duration-200"
          >
            הכירו את נבחרת 88 והצוות
          </Link>
        </div>
      </section>

      <section id="about-creation" className="py-20 md:py-28 bg-white/[0.01] border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>היצירה</SectionLabel>
          <SectionTitle>לא קורס. אקוסיסטם.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">
            Infinite Masterpiece היא מערכת שנבנית כדי לעזור ליוצרים להפוך כישרון למערכת עסקית. היא מחברת בין שידורי על,
            קהילה, Pods, Captains, ספריית אינסוף, משימות, מדידה, נבחרת 88 ופלטפורמת VOD. כדי שהמשתתפים לא רק ידעו יותר,
            אלא יעשו יותר.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WEBINAR_ECOSYSTEM.map((item, index) => {
              const Icon = ecosystemIcons[index];
              return (
                <GoldCard key={item.title} className="p-5">
                  <Icon className="w-6 h-6 text-[#C8A24C] mb-4" strokeWidth={1.5} aria-hidden />
                  <h3 className="text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 font-light leading-relaxed">{item.text}</p>
                </GoldCard>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pilot" className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>הפיילוט</SectionLabel>
          <SectionTitle>הפיילוט הראשון: 33 ימים של ניסוי, למידה וביצוע.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">
            המטרה של הפיילוט אינה “להוכיח שאנחנו צודקים”. המטרה היא לגלות מה עובד, מה נשבר, מה צריך לתקן, ולבנות Proof
            אמיתי לפני הסקייל.
          </p>
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {WEBINAR_PILOT_DAYS.map((item) => (
              <li key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                <h3 className="text-[#C8A24C] mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 font-light leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ol>
          <Link
            to="/journey"
            onClick={() => trackEvent('pilot_cta_clicked', { source: 'webinar' })}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-[#C8A24C]/40 text-[#F7E7B5] text-sm min-h-11 cursor-pointer hover:border-[#F7E7B5] transition-colors duration-200"
          >
            מידע מלא על הפיילוט
          </Link>
        </div>
      </section>

      <section id="transparency" className="py-20 md:py-28 bg-white/[0.01] border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>שקיפות</SectionLabel>
          <SectionTitle>אין אותיות קטנות. הכול בפרצוף.</SectionTitle>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">
            בוובינר נציג גם את עקרונות האחריות, הביטולים, הפרטיות, התקנון וההחזרים, בשפה שאפשר להבין. המטרה היא לבנות
            חברה שאנשים גאים לקנות ממנה: שקופה, אחראית, ישרה ומדויקת.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WEBINAR_TRANSPARENCY_POINTS.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 flex items-start justify-center gap-3">
                <Scale className="w-4 h-4 text-[#C8A24C] shrink-0 mt-0.5" aria-hidden />
                <span className="text-sm text-white/65 font-light">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="tracks" className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>הצטרפות לפיילוט</SectionLabel>
          <SectionTitle>שני מסלולי כניסה לפיילוט. אותו יעד. שתי רמות מחויבות.</SectionTitle>
          <p className="text-sm text-[#F7E7B5]/80 font-light leading-relaxed max-w-3xl mx-auto mb-10">
            אמיצים והססנים. לא נדרש הערב. בסוף הוובינר תהיה הזמנה להיכנס לפיילוט. רק למי שמתאים ורוצה להמשיך.
          </p>
          <aside
            aria-label="הרשמה לוובינר"
            className={`${REGISTER_CARD_CLASS} mx-auto w-full max-w-[380px] text-start`}
          >
            <WebinarRegisterCard
              payload={payload}
              formId="webinar-register-tracks"
              headlineParts={headlineParts}
              headlineVisible="always"
            />
          </aside>
          <p className="mt-6 text-[11px] text-white/35 font-light leading-relaxed">{WEBINAR_TRACKS_FINE_PRINT}</p>
        </div>
      </section>

      <section id="webinar-faq" className="py-20 md:py-28 border-t border-white/[0.04]">
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
          <WebinarSectionCta label={WEBINAR_CTA_FAQ} section="faq" onClick={() => scrollToForm('faq')} />
        </div>
      </section>

      <section id="webinar-register-bottom" className="relative py-20 md:py-28 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#010308] via-[#010308]/90 to-[#010308]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,90vw)] h-[240px] bg-[radial-gradient(ellipse_at_center,rgba(200,162,76,0.16),transparent_70%)]" />
        </div>
        <div className="relative z-10 max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-2xl md:text-3xl text-white font-light leading-tight mb-4">
            זה לא עוד וובינר. זה הצעד שמתחיל מערכת חדשה בחיים שלך.
          </p>
          <p className="text-sm text-[#C8A24C] font-light mb-8">מחכים לך בוובינר. גל, תמי וגלב.</p>
          <button
            type="button"
            onClick={() => scrollToForm('bottom')}
            className="w-full sm:w-auto mx-auto px-10 py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black font-semibold min-h-11 cursor-pointer hover:opacity-95 transition-opacity duration-200"
          >
            {WEBINAR_CTA_PRIMARY}
          </button>
          <div className="mt-4">
            <WebinarTrustStrip config={config} />
          </div>
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

      <WebinarExitIntent />
      <WebinarStickyCta
        date={config.date}
        time={config.time}
        registrationCount={payload.registrationCount}
      />
    </div>
  );
}
