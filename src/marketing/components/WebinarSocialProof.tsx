import type { WebinarSocialProofQuote } from '../../constants/webinar';

export function WebinarSocialProof({ quotes }: { quotes: WebinarSocialProofQuote[] }) {
  if (!quotes.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {quotes.slice(0, 3).map((item) => (
        <blockquote
          key={`${item.author}-${item.quote.slice(0, 20)}`}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-right"
        >
          <p className="text-sm text-white/65 font-light leading-relaxed mb-3">«{item.quote}»</p>
          <footer className="text-xs text-[#C8A24C]">
            {item.author}
            {item.role ? <span className="text-white/35"> · {item.role}</span> : null}
          </footer>
        </blockquote>
      ))}
    </div>
  );
}

export function WebinarTrustStrip({ config }: { config: { date: string; time: string; costLabel: string; durationMinutes: number } }) {
  return (
    <div className="rounded-xl border border-[#C8A24C]/15 bg-[#C8A24C]/5 px-4 py-3 text-xs text-white/55 font-light leading-relaxed">
      <p>
        {config.date} · {config.time} · {config.costLabel} · {config.durationMinutes} דק׳ · ללא התחייבות
      </p>
      <p className="text-white/35 mt-1">30 שניות · נשלח קישור לפני הוובינר</p>
    </div>
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
      className="mt-8 px-8 py-3 rounded-full bg-[#C8A24C] text-black text-sm font-semibold min-h-11 hover:bg-[#F7E7B5] transition-colors"
    >
      {label}
    </button>
  );
}
