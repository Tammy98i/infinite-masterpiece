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

const MotionDiv = motion.div;
const MotionSection = motion.section;

export function Home() {
  return (
    <div className="w-full">
      {/* 1. HERO */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full lg:w-[45%] h-full z-0 lg:z-10 opacity-30 lg:opacity-100 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ce7a?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#010308]/50 to-[#010308] hidden lg:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010308] via-transparent to-[#010308]" />
        </div>

        <div className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-end">
          <div className="w-full lg:w-[55%] lg:pr-16 flex flex-col justify-center items-start text-right">
            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md mb-8">
                <span className="w-2 h-2 rounded-full bg-[#C8A24C] animate-pulse" />
                <span className="text-[11px] font-medium tracking-[0.2em] text-white/60 uppercase">
                  The Masterpiece Framework
                </span>
              </div>

              <h1 className="text-[56px] md:text-[84px] font-light tracking-tighter leading-[1.05] mb-8">
                <span className="text-white block">יש לך יצירה.</span>
                <span className="text-gold-gradient font-medium block">
                  עכשיו בונים לה
                  <br />
                  מערכת הכנסה.
                </span>
              </h1>

              <p className="text-[18px] md:text-[22px] text-white/50 mb-12 max-w-xl leading-relaxed font-light">
                הבעיה היא לא שאין לך כישרון. הבעיה היא שאין סביב הכישרון שלך מערכת עסקית. אנו הופכים יצירה
                לעסק, השפעה וחופש.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                <a
                  href="/#pricing"
                  className="w-full sm:w-auto px-12 py-5 rounded-[22px] bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-lg font-bold transition-all duration-500 hover:-translate-y-1 flex items-center justify-center gap-3 group min-h-11"
                >
                  <span>להצטרף</span>
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </a>
              </div>
              <Link
                to="/library"
                className="mt-6 inline-block text-white/40 hover:text-[#C8A24C] transition-colors text-sm font-light"
              >
                כבר בפנים? כניסה לספרייה
              </Link>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* 2. UNIQUE VALUE */}
      <MotionSection
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1 }}
        className="py-20 md:py-28 relative"
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8">
            {[
              { icon: Target, text: 'מתחילים ממכירה\nלא מאפס' },
              { icon: Tag, text: 'מציגים ערך ברור\nומוכרים אותו' },
              { icon: BarChart3, text: 'מכניסים כסף\nורק אז בונים' },
              { icon: Settings, text: 'בונים מערכת עסקית\nסביב היצירה' },
              { icon: Rocket, text: 'סקייל, חופש והשפעה\nבקצב שלך' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-start gap-6 p-8 rounded-[24px] bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] transition-colors duration-500"
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
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1 }}
        className="py-20 md:py-28 relative z-10"
        id="depth-layer"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-4 font-semibold">
            שכבת העומק
          </p>
          <h2 className="text-4xl md:text-5xl font-serif italic text-white tracking-tight mb-5">נבחרת 88</h2>
          <p className="text-lg text-white/55 font-light leading-relaxed mb-3">
            עד 88 יוצרים שעובדים קרוב יותר. על ההצעה, המכירה והמודל. לפי התאמה, לא בלחיצת תשלום.
          </p>
          <p className="text-sm text-white/35 font-light mb-10">בנוסף למסלול הראשי. 8,888 ₪ לפני מע״מ.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm text-white/70 font-light mb-10 text-right">
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
              className="w-full sm:w-auto py-3.5 px-8 rounded-full text-black bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] font-bold text-sm min-h-11"
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
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1 }}
        className="py-20 md:py-28 relative bg-[#010308]"
        id="infinite-library"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#010308] via-transparent to-[#010308]" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <h2 className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-6 font-semibold">
              THE PLATFORM
            </h2>
            <h3 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight">
              כל מה שאת/ה צריך/ה כדי להתקדם{' '}
              <span className="font-serif italic text-gold-gradient">במקום אחד.</span>
            </h3>
            <p className="text-xl text-white/50 font-light max-w-2xl leading-relaxed">
              לא עוד קבצים מפוזרים, לינקים שנעלמים וקבוצות עמוסות. Infinite Masterpiece נבנית כפלטפורמה
              שמרכזת את המסלול, התכנים, המשימות, הקהילה וההתקדמות שלך במקום אחד.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'ספריית VOD', icon: PlaySquare, desc: 'כל השיעורים, המשימות והתבניות' },
              { title: 'אזור אישי', icon: UserCircle, desc: 'המסע שלך, המשימות והיעד הבא' },
              { title: 'מעקב ביצועים', icon: LineChart, desc: 'מדידת עשייה בפועל, לא רק צפייה' },
              { title: 'אפליקציה בהמשך', icon: Smartphone, desc: 'חוויית Mobile-First בכל מקום' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="relative bg-white/[0.01] border border-white/[0.03] rounded-[24px] p-8 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-500 group"
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
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1 }}
        id="pricing"
        className="py-16 md:py-20 relative"
      >
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C8A24C]/10 border border-[#C8A24C]/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A24C] animate-pulse" />
            <span className="text-[11px] font-medium tracking-[0.15em] text-[#F7E7B5] uppercase">
              המחזור הקרוב נפתח בקרוב
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif italic text-white mb-3">אמיצים או הססנים</h2>
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
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1 }}
        className="py-20 md:py-28 relative border-t border-white/[0.02]"
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
            className="inline-flex flex-col items-center justify-center px-12 py-6 rounded-[24px] bg-white/[0.02] text-white border border-[#C8A24C]/30 hover:bg-white/[0.05] hover:border-[#C8A24C]/60 transition-all duration-500 text-lg shadow-[0_0_20px_rgba(200,162,76,0.05)] hover:shadow-[0_0_40px_rgba(200,162,76,0.15)] group"
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
