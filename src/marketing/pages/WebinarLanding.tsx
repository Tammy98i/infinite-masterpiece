import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Target,
  Gem,
  Infinity,
  Network,
  Rocket,
  Check,
  X,
  Calendar,
  Clock,
  MapPin,
  Timer,
  ChevronDown,
  Smartphone,
  PlaySquare,
} from 'lucide-react';
import { webinarApi } from '../../api/webinar';
import {
  DEFAULT_WEBINAR_CONFIG,
  WEBINAR_FAQ,
  splitHeroHeadline,
  type WebinarPublicPayload,
} from '../../constants/webinar';
import { WebinarRegistrationForm } from '../components/WebinarRegistrationForm';
import { WebinarStickyCta } from '../components/WebinarStickyCta';
import { WebinarExitIntent } from '../components/WebinarExitIntent';
import { WebinarSocialProof, WebinarSectionCta } from '../components/WebinarSocialProof';
import { trackEvent, trackWebinarCta, scrollToWebinarForm, scrollToWebinarFit } from '../../utils/analytics';
import { captureUtmFromSearch } from '../../utils/utm';

const benefits = [
  {
    icon: Target,
    title: 'מה אפשר למכור כבר עכשיו',
    text: 'בלי לחכות למותג מושלם, אתר מושלם או עוד שנה של תכנון.',
  },
  {
    icon: Gem,
    title: 'כישרון → הצעה ברורה',
    text: 'כך שאנשים יבינו מהר מה הערך שלך ולמה לשלם עליו.',
  },
  {
    icon: Infinity,
    title: 'קודם מכירה, אחר כך שיווק',
    text: 'העיקרון של Reverse Business Mentoring.',
  },
  {
    icon: Network,
    title: 'מערכת סביב היצירה',
    text: 'מוצר, מחיר, מסר, תוכן, Follow-up ופעולה יומית.',
  },
  {
    icon: Rocket,
    title: 'הפיילוט הראשון',
    text: 'מה מקבלים, למי זה מתאים, ומה מסלול ההמשך.',
  },
];

const painBullets = [
  'יש לך יכולת, אבל אין הצעה ברורה.',
  'יש לך ידע, אבל קשה להסביר למה הוא שווה כסף.',
  'יש לך תוכן, אבל אין מערכת שמביאה לקוחות.',
  'יש לך חלום, אבל אין פעולות יומיות שמקדמות אותו.',
  'את/ה מרגיש/ה שאנשים פחות מוכשרים מצליחים יותר עסקית.',
];

const fitYes = [
  'יש לך כישרון, ידע, יצירה או מומחיות.',
  'את/ה רוצה להתחיל להרוויח מזה יותר.',
  'קשה לך למכור את עצמך.',
  'יש לך רעיון אבל אין לך הצעה ברורה.',
  'יש לך עסק יצירתי אבל אין מספיק יציבות.',
  'את/ה מרגיש/ה שיש לך יותר ערך ממה שהשוק רואה.',
  'את/ה רוצה מסגרת שתגרום לך לבצע, לא רק לקבל השראה.',
];

const fitNo = [
  'את/ה מחפש/ת קסם או כסף קל.',
  'אין לך כוונה לבצע.',
  'את/ה רוצה רק לצפות בלי לזוז.',
  'את/ה מצפה לתוצאה בלי אחריות אישית.',
];

function FaqItem({ q, a }: { q: string; a: string; key?: string }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-white font-light">
        <span>{q}</span>
        <ChevronDown className="w-4 h-4 text-[#C8A24C] group-open:rotate-180 transition-transform shrink-0" />
      </summary>
      <p className="mt-4 text-sm text-white/50 font-light leading-relaxed">{a}</p>
    </details>
  );
}

function DetailTile({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#C8A24C]/20 bg-[#C8A24C]/5 px-4 py-5 text-center">
      <Icon className="w-5 h-5 text-[#C8A24C] mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">{label}</p>
      <p className="text-sm text-white/85 font-light">{value}</p>
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

  const scrollToForm = () => {
    trackWebinarCta('hero');
    scrollToWebinarForm();
  };

  const defaultPayload = payload;

  return (
    <div className="w-full pb-24 lg:pb-0">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ce7a?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#010308] via-[#010308]/80 to-[#010308]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[min(900px,90vw)] h-[320px] bg-[radial-gradient(ellipse_at_center,rgba(200,162,76,0.18),transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-10 xl:gap-14 items-start">
            <motion.aside
              id="webinar-register-hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="order-1 xl:order-1 rounded-3xl border border-[#C8A24C]/30 bg-[#010308]/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/40"
            >
              <WebinarRegistrationForm payload={defaultPayload} formId="webinar-register-hero" />
            </motion.aside>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="order-2 xl:order-2 text-right"
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.03] border border-[#C8A24C]/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#C8A24C] animate-pulse" />
                <span className="text-[11px] tracking-[0.2em] text-white/60 uppercase">Webinar · Pilot Entry</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-light tracking-tight leading-[1.05] mb-6">
                <span className="text-white block">{headlineParts.line1}</span>
                {headlineParts.line2 ? (
                  <span className="text-gold-gradient font-medium block mt-2">{headlineParts.line2}</span>
                ) : null}
              </h1>

              <p className="text-lg md:text-xl text-white/50 font-light leading-relaxed max-w-2xl mb-10">
                {config.heroSubheadline}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 max-w-3xl">
                <DetailTile icon={Calendar} label="תאריך" value={config.date} />
                <DetailTile icon={Clock} label="שעה" value={config.time} />
                <DetailTile icon={Timer} label="משך" value={`${config.durationMinutes} דק׳`} />
                <DetailTile icon={MapPin} label="מיקום" value={config.location} />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="px-10 py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black font-semibold min-h-11"
                >
                  כן, אני רוצה להירשם לוובינר
                </button>
                <button
                  type="button"
                  onClick={scrollToWebinarFit}
                  className="px-10 py-4 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-[#C8A24C]/40 text-center min-h-11"
                >
                  רוצה להבין אם זה מתאים לך?
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pain */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-right">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C8A24C] mb-4">הבעיה</p>
          <h2 className="text-3xl md:text-5xl font-light text-white mb-6 leading-tight">
            הבעיה היא לא שאין לך כישרון.
            <br />
            <span className="text-white/40">הבעיה היא שאין סביבו מערכת.</span>
          </h2>
          <p className="text-white/50 font-light leading-relaxed max-w-3xl mb-10">
            הרבה יוצרים יודעים ליצור, ללמד, להופיע, לטפל, לעצב, להדריך או להעביר ערך. אבל כשהם צריכים למכור את
            זה, לתמחר את זה, להסביר את זה, לבנות קהל סביב זה ולהפוך את זה להכנסה — משהו נתקע. בוובינר נדבר בדיוק על
            הפער הזה.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {painBullets.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm text-white/65 font-light">
                {item}
              </li>
            ))}
          </ul>
          <WebinarSectionCta label="שריינו מקום בוובינר" section="pain" onClick={scrollToForm} />
        </div>
      </section>
      <section className="py-20 md:py-28 bg-white/[0.01] border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-right">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C8A24C] mb-4">מה נבנה יחד</p>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-12">מה נבנה יחד בוובינר?</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {benefits.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-[#C8A24C]/15 bg-[#C8A24C]/5 p-5">
                <item.icon className="w-6 h-6 text-[#C8A24C] mb-4" strokeWidth={1.5} />
                <p className="text-[11px] text-[#C8A24C] mb-2">{index + 1}</p>
                <h3 className="text-white text-sm font-medium mb-2">{item.title}</h3>
                <p className="text-xs text-white/45 font-light leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <WebinarSectionCta label="אני רוצה להירשם" section="benefits" onClick={scrollToForm} />
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-right">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C8A24C] mb-4">למה אנשים נרשמים</p>
          <WebinarSocialProof quotes={config.socialProofQuotes} />
        </div>
      </section>

      {/* Fit */}
      <section id="webinar-fit" ref={fitRef} className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_1fr] gap-8 items-center">
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 text-right order-2 lg:order-1">
              <h3 className="text-lg text-white mb-4 font-light">לא מתאים אם…</h3>
              <ul className="space-y-3">
                {fitNo.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/55 font-light">
                    <X className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative h-64 lg:h-80 rounded-3xl overflow-hidden order-1 lg:order-2">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#010308] to-transparent" />
              <div className="absolute inset-x-0 bottom-8 flex justify-center">
                <div className="w-24 h-32 border border-[#C8A24C]/50 rounded-t-full bg-[radial-gradient(circle_at_bottom,rgba(200,162,76,0.35),transparent)]" />
              </div>
            </div>

            <div className="rounded-3xl border border-[#C8A24C]/25 bg-[#C8A24C]/5 p-6 text-right order-3">
              <h3 className="text-lg text-white mb-4 font-light">הוובינר מתאים לך אם…</h3>
              <ul className="space-y-3">
                {fitYes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/65 font-light">
                    <Check className="w-4 h-4 text-[#C8A24C] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <WebinarSectionCta label="כן, זה מתאים לי — הרשמה" section="fit" onClick={scrollToForm} />
        </div>
      </section>
      <section className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-right">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C8A24C] mb-4">מי מוביל</p>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-12">מי מוביל את הוובינר?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            ].map((leader) => (
              <article key={leader.name} className="rounded-3xl border border-white/10 overflow-hidden bg-white/[0.02]">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={leader.image} alt={leader.name} className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl text-white mb-1">{leader.name}</h3>
                  <p className="text-sm text-[#C8A24C] mb-4">{leader.title}</p>
                  <p className="text-sm text-white/50 font-light leading-relaxed">{leader.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="py-20 md:py-28 bg-white/[0.01] border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#C8A24C] mb-4">המערכת</p>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">זה לא עוד קורס. זו מערכת־על ליוצרים.</h2>
              <p className="text-white/50 font-light leading-relaxed mb-6">
                Infinite Masterpiece נבנית כמערכת שמחברת בין וובינרים, הרצאות, ספריית VOD, קהילה, משימות, מדידה,
                מייסדים, מרצים, נבחרת 88 ומסלולי כניסה שונים — כדי לעזור ליוצרים להפוך ערך יצירתי למערכת עסקית.
              </p>
              <p className="text-white/40 text-sm font-light mb-8">
                בוובינר הראשון תקבל/י הצצה לשיטה, לשפה, למודל ולדרך שבה הפיילוט הולך להיפתח.
              </p>
              <Link to="/library-membership" className="text-[#C8A24C] hover:text-[#F7E7B5] text-sm underline-offset-4 hover:underline">
                לקריאה על הספרייה והמנוי
              </Link>
            </div>
            <div className="relative rounded-3xl border border-[#C8A24C]/20 bg-gradient-to-br from-[#C8A24C]/10 to-transparent p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-[#010308]/80 p-4">
                  <Smartphone className="w-8 h-8 text-[#C8A24C] mb-3" />
                  <p className="text-sm text-white/70">ספרייה · מובייל</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#010308]/80 p-4">
                  <PlaySquare className="w-8 h-8 text-[#C8A24C] mb-3" />
                  <p className="text-sm text-white/70">VOD · מסלולים</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#010308]/60 p-6 text-right">
                <p className="text-xs uppercase tracking-widest text-[#C8A24C] mb-2">Infinite Masterpiece</p>
                <p className="text-white/60 text-sm font-light">דשבורד, מדידה, קהילה ומשימות — במקום אחד.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details + FAQ */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="rounded-3xl border border-[#C8A24C]/25 bg-[#C8A24C]/5 p-8 text-right">
              <h2 className="text-2xl text-white font-light mb-6">{config.title}</h2>
              <ul className="space-y-4 text-sm text-white/60 font-light">
                <li>מתי: {config.date}</li>
                <li>שעה: {config.time}</li>
                <li>איפה: {config.location}</li>
                <li>משך: {config.durationMinutes} דקות</li>
                <li>מתאים ל: יוצרים, אמנים, מומחים ועסקים יצירתיים</li>
                <li>עלות: {config.costLabel}</li>
                <li>{config.spotsLabel}</li>
              </ul>
              <button
                type="button"
                onClick={scrollToForm}
                className="mt-8 w-full py-4 rounded-full bg-[#C8A24C] text-black font-semibold min-h-11"
              >
                שריינו לי מקום בוובינר
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl text-white font-light mb-4 text-right">שאלות נפוצות</h2>
              {WEBINAR_FAQ.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
              <WebinarSectionCta label="נשארה שאלה? הרשמו ונענה בלייב" section="faq" onClick={scrollToForm} />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom form + CTA */}
      <section id="webinar-register-bottom" className="py-20 md:py-28 border-t border-white/[0.04]">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#C8A24C]/30 bg-[#010308]/80 backdrop-blur-xl p-6 md:p-8">
            <WebinarRegistrationForm payload={defaultPayload} formId="webinar-register-bottom" />
          </div>
          <p className="text-center text-sm text-white/35 font-light mt-8 max-w-lg mx-auto leading-relaxed">
            «הצעד הראשון לשינוי במציאות מתחיל בהחלטה אחת פשוטה.» — {config.leaderPrimaryName.split(' ')[0]}
          </p>
        </div>
      </section>

      <WebinarExitIntent />
      <WebinarStickyCta />
    </div>
  );
}
