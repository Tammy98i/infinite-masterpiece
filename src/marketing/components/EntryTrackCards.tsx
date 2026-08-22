import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { ENTRY_TRACK_FINE_PRINT } from '../../data/entryTracks';
import { trackEvent } from '../../utils/analytics';

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 text-right mb-6">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-[13px] text-white/60 font-light">
          <Check className="w-3.5 h-3.5 text-[#C8A24C] shrink-0 mt-0.5" strokeWidth={1.5} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function EntryTrackCards() {
  useEffect(() => {
    trackEvent('track_selection_viewed');
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-2 gap-4 text-right items-stretch">
        <article className="flex flex-col rounded-2xl border border-[#C8A24C]/40 bg-[#C8A24C]/[0.07] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 min-h-8 mb-3">
            <h3 className="text-lg sm:text-xl font-serif italic text-white">מסלול האמיצים</h3>
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#C8A24C] text-black text-[10px] font-semibold tracking-wide">
              מומלץ
            </span>
          </div>
          <p className="text-[13px] text-white/50 font-light mb-4 min-h-10">
            למי שכבר יודע/ת שזה הזמן להיכנס עד הסוף.
          </p>
          <div className="mb-4 min-h-14">
            <p className="text-2xl font-light text-white">8,008 ₪</p>
            <p className="text-[11px] text-white/35 mt-1">+ מע״מ · תשלום מלא</p>
          </div>
          <FeatureList
            items={[
              'גישה מלאה למיזם ולספרייה',
              'השתתפות במסלול המלא',
              '2 כרטיסי כניסה לכל הגרלה',
            ]}
          />
          <Link
            to="/application?track=brave"
            onClick={() => trackEvent('brave_track_clicked')}
            className="mt-auto inline-flex justify-center items-center w-full py-3 px-4 rounded-full text-black bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] font-bold text-sm min-h-11"
          >
            אני בוחר/ת באומץ
          </Link>
        </article>

        <article className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 min-h-8 mb-3">
            <h3 className="text-lg sm:text-xl font-serif italic text-white">מסלול ההססנים</h3>
            <span className="shrink-0 px-2.5 py-1 text-[10px] opacity-0 pointer-events-none" aria-hidden>
              מומלץ
            </span>
          </div>
          <p className="text-[13px] text-white/50 font-light mb-4 min-h-10">
            למי שרוצה להיכנס שלב שלב. גישה מלאה מההתחלה.
          </p>
          <div className="mb-4 min-h-14">
            <p className="text-2xl font-light text-white">8 ₪ היום</p>
            <p className="text-[11px] text-white/35 mt-1">ואחר כך 80 · 800 · 8,000</p>
          </div>
          <FeatureList
            items={[
              'גישה מלאה למיזם ולספרייה',
              'סך הכל: 8,888 ₪ לפני מע״מ',
              'כרטיס כניסה אחד לכל הגרלה',
            ]}
          />
          <Link
            to="/hesitation"
            onClick={() => trackEvent('hesitant_track_clicked')}
            className="mt-auto inline-flex justify-center items-center w-full py-3 px-4 rounded-full text-white border border-[#C8A24C]/40 hover:border-[#F7E7B5] hover:text-[#F7E7B5] font-medium text-sm min-h-11"
          >
            אני מתחיל/ה ב־8 ₪
          </Link>
        </article>
      </div>

      <p className="mt-6 text-[11px] text-white/28 font-light leading-relaxed text-right">
        {ENTRY_TRACK_FINE_PRINT}
      </p>
    </div>
  );
}
