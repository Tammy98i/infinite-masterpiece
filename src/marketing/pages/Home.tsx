import { motion } from 'motion/react';
import {
  Target,
  Tag,
  BarChart3,
  Settings,
  Rocket,
  Infinity,
  ArrowLeft,
  Smartphone,
  PlaySquare,
  UserCircle,
  LineChart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EntryTrackCards } from '../components/EntryTrackCards';
import { WEBINAR_CTA_ENDED, WEBINAR_CTA_HEADER, WEBINAR_CTA_NEXT_CYCLE } from '../../constants/webinarPage';
import { useWebinarPhase } from '../hooks/useWebinarPhase';

const MotionDiv = motion.div;
const MotionSection = motion.section;
const MOTION = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

export function Home() {
  const { phase } = useWebinarPhase();
  const homeCta = phase === 'ended' ? WEBINAR_CTA_NEXT_CYCLE : WEBINAR_CTA_HEADER;
  return (
    <div className="w-full">
      {/* 1. HERO */}
      <section className="relative min-h-0 md:min-h-screen flex items-center pt-20 pb-8 md:pt-20 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#010308]/30 via-transparent to-[#010308]/40" />
        </div>

        <div className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-center">
          <div className="w-full max-w-3xl flex flex-col justify-center items-center text-center">
            <MotionDiv
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={MOTION}
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md mb-8">
                <span className="w-2 h-2 rounded-full bg-[#C8A24C]" />
                <span className="text-[11px] font-medium tracking-[0.2em] text-white/60 uppercase">
                  The Masterpiece Framework
                </span>
              </div>

              <h1 className="text-[32px] sm:text-[40px] md:text-[84px] font-heading tracking-tight leading-[1.15] mb-4 md:mb-8">
                <span className="text-white block">יש לך יצירה.</span>
                <span className="text-gold-gradient font-medium block">עכשיו בונים לה מערכת הכנסה.</span>
              </h1>

              <p className="text-[16px] md:text-[22px] text-white/50 mb-6 md:mb-12 max-w-xl leading-relaxed font-light">
                הבעיה היא לא שאין לך כישרון. הבעיה היא שאין סביב הכישרון שלך מערכת עסקית. אנו הופכים יצירה
                לעסק, השפעה וחופש.
              </p>

              <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
                <Link
                  to={phase === 'ended' ? '/pricing' : '/webinar'}
                  className="btn-gold text-black text-lg w-full sm:w-auto px-12 py-5 rounded-[22px] flex items-center justify-center gap-3 group"
                >
                  <span>{homeCta}</span>
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-500" />
                </Link>
                {phase === 'ended' ? (
                  <p className="text-white/70 text-sm font-medium min-h-11 inline-flex items-center">
                    {WEBINAR_CTA_ENDED}
                  </p>
                ) : (
                  <a
                    href="/#pricing"
                    className="text-white/45 hover:text-[#C8A24C] transition-colors duration-500 text-sm font-light min-h-11 inline-flex items-center"
                  >
                    למסלול האמיצים והססנים
                  </a>
                )}
                <Link
                  to="/library"
                  className="text-white/30 hover:text-[#C8A24C] transition-colors duration-500 text-sm font-light min-h-11 inline-flex items-center"
                >
                  כבר בפנים? כניסה לספרייה
                </Link>
              </div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* 2. UNIQUE VALUE */}
      <MotionSection
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={MOTION}
        className="section-block relative"
        id="what-is-it"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-6 font-semibold">
              במה זה שונה
            </h2>
            <p className="text-3xl md:text-5xl font-light text-white max-w-3xl leading-tight">
              אנחנו לא מוכרים חלומות. <br />
              <span className="text-white/40">אנחנו בונים מערכות עבודה חכמות.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">
            {[
              { icon: Target, text: 'מתחילים ממכירה\nלא מאפס' },
              { icon: Tag, text: 'מציגים ערך ברור\nומוכרים אותו' },
              { icon: BarChart3, text: 'מכניסים כסף\nורק אז בונים' },
              { icon: Settings, text: 'בונים מערכת עסקית\nסביב היצירה' },
              { icon: Rocket, text: 'סקייל, חופש והשפעה\nבקצב שלך' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="glass-card flex flex-col items-center justify-start gap-6 p-8 hover:border-[#C8A24C]/50 transition-colors duration-500"
              >
                <item.icon className="w-8 h-8 text-[#C8A24C] opacity-70" strokeWidth={1} />
                <p className="text-white/60 text-[15px] whitespace-pre-line leading-relaxed text-center font-light">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/journey"
              className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-[#C8A24C] transition-colors"
            >
              <span>לפירוט מסע 33 הימים</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </MotionSection>

      {/* נבחרת 88 */}
      <MotionSection
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={MOTION}
        className="section-block relative z-10"
        id="depth-layer"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-4 font-semibold">
            שכבת העומק
          </p>
          <h2 className="text-4xl md:text-5xl font-heading text-white tracking-tight mb-5">נבחרת 88</h2>
          <p className="text-lg text-white/55 font-light leading-relaxed mb-3">
            עד 88 יוצרים שעובדים קרוב יותר. על ההצעה, המכירה והמודל. לפי התאמה, לא בלחיצת תשלום.
          </p>
          <p className="text-sm text-white/35 font-light mb-10">בנוסף למסלול הראשי. 8,888 ₪ לפני מע״מ.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm text-white/70 font-light mb-10 text-center">
            {['Hot Seats', 'Micro-Pods', 'Mastermind', 'ניתוח אישי', 'גישה למומחים', 'ליווי הטמעה'].map(
              (item) => (
                <span key={item}>{item}</span>
              )
            )}
          </div>

          <p className="text-sm text-white/40 font-light mb-8">טופס · בדיקה · שיחה · החלטה · תשלום</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/application?type=88"
              className="btn-gold text-black w-full sm:w-auto py-3.5 px-8 text-sm"
            >
              הגשת מועמדות
            </Link>
            <Link to="/premium-88" className="text-sm text-white/40 hover:text-[#C8A24C] transition-colors">
              הצוות מאחורי המערכת
            </Link>
          </div>
        </div>
      </MotionSection>

      {/* PLATFORM */}
      <MotionSection
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={MOTION}
        className="section-block relative"
        id="infinite-library"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#010308]/15 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-24">
            <h2 className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-6 font-semibold">
              THE PLATFORM
            </h2>
            <h3 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight">
              כל מה שאת/ה צריך/ה כדי להתקדם{' '}
              <span className="font-heading text-gold-gradient">במקום אחד.</span>
            </h3>
            <p className="text-xl text-white/50 font-light max-w-2xl leading-relaxed">
              לא עוד קבצים מפוזרים, לינקים שנעלמים וקבוצות עמוסות. Infinite Masterpiece נבנית כפלטפורמה
              שמרכזת את המסלול, התכנים, המשימות, הקהילה וההתקדמות שלך במקום אחד.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'ספריית VOD', icon: PlaySquare, desc: 'כל השיעורים, המשימות והתבניות' },
              { title: 'אזור אישי', icon: UserCircle, desc: 'המסע שלך, המשימות והיעד הבא' },
              { title: 'מעקב ביצועים', icon: LineChart, desc: 'מדידת עשייה בפועל, לא רק צפייה' },
              { title: 'אפליקציה בהמשך', icon: Smartphone, desc: 'חוויית Mobile-First בכל מקום' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="glass-card relative p-8 hover:border-[#C8A24C]/50 transition-all duration-500 group"
              >
                <feature.icon
                  className="w-8 h-8 text-white/30 group-hover:text-[#C8A24C] transition-colors duration-500 mb-6"
                  strokeWidth={1}
                />
                <h4 className="text-xl font-light text-white mb-2">{feature.title}</h4>
                <p className="text-[14px] text-white/40 font-light leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/library"
              className="inline-flex items-center gap-2 text-[13px] uppercase tracking-widest text-white/40 hover:text-[#C8A24C] transition-colors group"
            >
              <span>כבר בפנים? כניסה לספרייה</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </MotionSection>

      {/* PRICING */}
      <MotionSection
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={MOTION}
        id="pricing"
        className="section-block relative"
      >
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C8A24C]/10 border border-[#C8A24C]/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A24C]" />
            <span className="text-[11px] font-medium tracking-[0.15em] text-[#F7E7B5] uppercase">
              אמיצים או הססנים
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-heading text-white mb-3">שתי דרכי כניסה. אותו מסע.</h2>
          <p className="text-sm text-white/45 font-light max-w-xl mx-auto leading-relaxed mb-10">
            אמיצים: 8,008 ₪ לפני מע״מ. הססנים: 8,888 ₪ בפריסה. ההבדל בקצב הכניסה ובכרטיסי ההגרלה.
          </p>

          <EntryTrackCards />
        </div>
      </MotionSection>

      {/* HESITATION */}
      <MotionSection
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={MOTION}
        className="section-block relative border-t border-white/[0.02]"
        id="who-is-it-for"
      >
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Infinity className="w-8 h-8 text-white/20 mx-auto mb-8" strokeWidth={1} />
          <h2 className="text-[13px] uppercase tracking-[0.3em] text-white/40 mb-6 font-semibold">
            החלטה מדויקת
          </h2>

          <h3 className="text-4xl md:text-5xl font-light text-white mb-8">רוצים להיכנס שלב שלב?</h3>

          <p className="text-xl text-white/50 font-light max-w-2xl mx-auto mb-16 leading-relaxed">
            מסלול ההססנים הוא אותו מחיר מלא, 8,888 ₪ לפני מע״מ, בפריסה שמתחילה ב־8 ₪. לא הנחה ולא מסלול
            חלקי. דרך כניסה למי שצריך לבנות ביטחון תוך כדי תנועה.
          </p>

          <Link
            to="/hesitation"
            className="glass-card inline-flex flex-col items-center justify-center px-12 py-6 text-white hover:border-[#C8A24C]/60 transition-all duration-500 text-lg group"
          >
            <span className="font-medium mb-1">אני מתחיל/ה ב־8 ₪</span>
            <span className="text-sm text-white/40 group-hover:text-[#C8A24C] transition-colors">
              ואחר כך 80, 800 ו־8,000 לפי שלבי המיזם
            </span>
          </Link>
        </div>
      </MotionSection>
    </div>
  );
}
