import { useEffect, useMemo, useState } from 'react';
import type { WebinarConfig } from '../../constants/webinar';
import { parseIsraeliDateTime } from '../../utils/webinarTime';

type Props = {
  date: string;
  time: string;
  className?: string;
};

export function WebinarCountdown({ date, time, className = '' }: Props) {
  const target = useMemo(() => parseIsraeliDateTime(date, time), [date, time]);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!target) {
      setLabel('');
      return;
    }

    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        const now = new Date();
        const isSameDay =
          now.getFullYear() === target.getFullYear() &&
          now.getMonth() === target.getMonth() &&
          now.getDate() === target.getDate();
        setLabel(isSameDay ? 'היום!' : '');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      if (days > 0) setLabel(`נשארו ${days} ימים · ${hours} שעות`);
      else if (hours > 0) setLabel(`נשארו ${hours} שעות · ${minutes} דק׳`);
      else setLabel(`מתחיל בעוד ${minutes} דק׳`);
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!label) return null;

  return (
    <p className={`text-xs text-[#C8A24C] font-light ${className}`} aria-live="polite">
      {label}
    </p>
  );
}

export function WebinarUrgencyStrip({
  config,
  registrationCount,
  spotsRemaining,
}: {
  config: WebinarConfig;
  registrationCount: number;
  spotsRemaining: number | null;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50 font-light">
      {config.showRegistrationCount && registrationCount > 0 ? (
        <span>{registrationCount}+ נרשמו כבר</span>
      ) : null}
      {config.showSpotsRemaining && spotsRemaining !== null ? (
        <span>{spotsRemaining > 0 ? `${spotsRemaining} מקומות נותרו` : 'רשימת המתנה'}</span>
      ) : null}
      <WebinarCountdown date={config.date} time={config.time} />
    </div>
  );
}
