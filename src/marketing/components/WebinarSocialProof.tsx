import type { WebinarSocialProofQuote } from '../../constants/webinar';

export function WebinarSocialProof({ quotes }: { quotes: WebinarSocialProofQuote[] }) {
  if (!quotes.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {quotes.slice(0, 3).map((item) => (
        <blockquote
          key={`${item.author}-${item.quote.slice(0, 20)}`}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-right"
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className="w-9 h-9 rounded-full border border-[#C8A24C]/40 bg-[#C8A24C]/10 text-[#F7E7B5] text-sm flex items-center justify-center shrink-0"
              aria-hidden
            >
              {item.author.slice(0, 1)}
            </span>
            <footer className="text-xs text-[#C8A24C]">
              {item.author}
              {item.role ? <span className="block text-white/35 mt-0.5">{item.role}</span> : null}
            </footer>
          </div>
          <p className="text-sm text-white/65 font-light leading-relaxed">«{item.quote}»</p>
        </blockquote>
      ))}
    </div>
  );
}

export function WebinarTrustStrip({ config }: { config: { durationMinutes: number } }) {
  return (
    <p className="text-[11px] text-white/40 font-light leading-relaxed">
      בלי כרטיס אשראי. {config.durationMinutes} דקות בלייב. לא מבטיחים הכנסה
    </p>
  );
}

import { trackWebinarCta } from '../../utils/analytics';

export function WebinarSectionCta({
  label,
  section,
  onClick,
}: {
  label: string;
  section: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        trackWebinarCta(section);
        onClick();
      }}
      data-section={section}
      className="mt-8 px-8 py-3 rounded-full bg-[#C8A24C] text-black text-sm font-semibold min-h-11 cursor-pointer hover:bg-[#F7E7B5] transition-colors duration-200"
    >
      {label}
    </button>
  );
}
