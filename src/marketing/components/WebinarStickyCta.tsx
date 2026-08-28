import { useEffect, useState } from 'react';
import { trackWebinarCta, scrollToWebinarForm } from '../../utils/analytics';
import { WebinarCountdown } from './WebinarCountdown';
import { WEBINAR_CTA_PRIMARY, WEBINAR_CTA_SHORT } from '../../constants/webinarPage';

type Props = {
  date: string;
  time: string;
  registrationCount?: number;
};

export function WebinarStickyCta({ date, time, registrationCount = 0 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById('webinar-register');
    if (!target) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisible(!entries.some((entry) => entry.isIntersecting));
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#C8A24C]/20 bg-[#010308]/95 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-[1100px] mx-auto flex items-center gap-3">
        <div className="min-w-0 flex-1 text-center sm:text-right">
          <p className="text-xs text-white/70 truncate">
            {date}, {time}
          </p>
          <div className="flex items-center gap-3 min-w-0">
            <WebinarCountdown date={date} time={time} className="truncate" />
            {registrationCount > 0 ? (
              <span className="hidden sm:inline text-[11px] text-white/40 shrink-0">{registrationCount}+ נרשמו</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            trackWebinarCta('sticky');
            scrollToWebinarForm();
          }}
          className="shrink-0 sm:min-w-[240px] text-center py-3 px-5 sm:px-6 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-sm font-semibold min-h-11 cursor-pointer hover:opacity-95 transition-opacity duration-200"
        >
          <span className="sm:hidden">{WEBINAR_CTA_SHORT}</span>
          <span className="hidden sm:inline">{WEBINAR_CTA_PRIMARY}</span>
        </button>
      </div>
    </div>
  );
}
