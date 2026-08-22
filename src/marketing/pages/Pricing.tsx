import { EntryTrackCards } from '../components/EntryTrackCards';

export function Pricing() {
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C8A24C]/10 border border-[#C8A24C]/20 mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C8A24C] animate-pulse" />
        <span className="text-[11px] font-medium tracking-[0.15em] text-[#F7E7B5] uppercase">
          המחזור הקרוב נפתח בקרוב
        </span>
      </div>

      <h1 className="text-3xl md:text-5xl font-serif italic text-white mb-4">
        אמיצים או הססנים
      </h1>
      <p className="text-sm md:text-base text-white/45 font-light leading-relaxed max-w-xl mx-auto mb-12">
        אמיצים: 8,008 ₪ לפני מע״מ. הססנים: 8,888 ₪ בפריסה. ההבדל בקצב הכניסה ובכרטיסי ההגרלה.
      </p>

      <EntryTrackCards />
    </div>
  );
}
