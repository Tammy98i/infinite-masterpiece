import { useEffect, useState } from 'react';
import { trackWebinarCta, scrollToWebinarForm } from '../../utils/analytics';
import { WebinarCountdown } from './WebinarCountdown';
import {
  WEBINAR_CTA_NOT_REGISTERED,
  WEBINAR_CTA_PRIMARY,
  WEBINAR_CTA_SHORT,
  webinarLiveEnter,
} from '../../constants/webinarPage';

type Props = {
  date: string;
  time: string;
  registrationCount?: number;
  eventNight?: boolean;
  zoomLink?: string;
  whatsappGroupUrl?: string;
};

export function WebinarStickyCta({
  date,
  time,
  registrationCount = 0,
  eventNight = false,
  zoomLink = '',
  whatsappGroupUrl = '',
}: Props) {
  const [visible, setVisible] = useState(false);
  const liveEnter = webinarLiveEnter(zoomLink, whatsappGroupUrl);

  useEffect(() => {
    const hero = document.getElementById('webinar-hero');
    const form = document.getElementById('webinar-register');
    if (!hero && !form) {
      setVisible(true);
      return;
    }

    let heroVisible = Boolean(hero);
    let formVisible = false;

    const update = () => {
      setVisible(!heroVisible && !formVisible);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.id === 'webinar-hero') heroVisible = entry.isIntersecting;
          if (entry.target.id === 'webinar-register') formVisible = entry.isIntersecting;
        }
        update();
      },
      { threshold: 0.12 }
    );
    if (hero) observer.observe(hero);
    if (form) observer.observe(form);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  const ctaClass =
    'shrink-0 sm:min-w-[240px] text-center py-3 px-5 sm:px-6 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-sm font-semibold min-h-11 cursor-pointer hover:opacity-95 transition-opacity duration-200';

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#C8A24C]/20 bg-[#010308]/95 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-[1100px] mx-auto flex items-center gap-3">
        <div className="min-w-0 flex-1 text-center sm:text-right">
          <p className="text-xs text-white/70 truncate">
            {eventNight ? 'הערב החי עכשיו' : `${date}, ${time}`}
          </p>
          {eventNight ? null : (
            <div className="flex items-center gap-3 min-w-0">
              <WebinarCountdown date={date} time={time} className="truncate" />
              {registrationCount > 0 ? (
                <span className="hidden sm:inline text-[11px] text-white/40 shrink-0">{registrationCount}+ נרשמו</span>
              ) : null}
            </div>
          )}
        </div>
        {eventNight && liveEnter.href ? (
          <a
            href={liveEnter.href}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackWebinarCta('sticky_enter')}
            className={ctaClass}
          >
            {liveEnter.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => {
              trackWebinarCta(eventNight ? 'sticky_unregistered' : 'sticky');
              scrollToWebinarForm();
            }}
            className={ctaClass}
          >
            {eventNight ? (
              <span>{WEBINAR_CTA_NOT_REGISTERED}</span>
            ) : (
              <>
                <span className="sm:hidden">{WEBINAR_CTA_SHORT}</span>
                <span className="hidden sm:inline">{WEBINAR_CTA_PRIMARY}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
