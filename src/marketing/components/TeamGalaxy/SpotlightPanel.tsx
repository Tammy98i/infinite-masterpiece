import { useEffect, useId, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { TeamMember } from '../../../api/teamMembers';
import { GalaxyPortrait } from './GalaxyPortrait';
import { localizedName, localizedRole } from '../../../constants/teamGalaxySeed';

interface SpotlightPanelProps {
  member: TeamMember | null;
  settings: { show_impact: boolean; show_quotes: boolean; show_expertise: boolean; show_links?: boolean };
  variant: 'docked' | 'sheet' | 'inline' | 'modal';
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function SpotlightPanel({
  member,
  settings,
  variant,
  onClose,
  onPrev,
  onNext,
}: SpotlightPanelProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isFounder = member?.group_key === 'founder' || member?.hierarchy_level === 'founder';

  useEffect(() => {
    if ((variant !== 'sheet' && variant !== 'modal') || !member) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const rootId = variant === 'modal' ? 'team-profile-modal' : 'team-profile-sheet';
    const getRoot = () => document.getElementById(rootId);
    const focusables = () => {
      const root = getRoot();
      if (!root) return [];
      return [...root.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      )].filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const root = getRoot();
      if (e.shiftKey && (active === first || !active || !root?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !active || !root?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      const root = getRoot();
      if (!root) return;
      if (e.target instanceof Node && !root.contains(e.target)) {
        focusables()[0]?.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn);
      document.body.style.overflow = previousOverflow;
    };
  }, [variant, member, onClose]);

  if (!member) return null;

  // Mobile stays on the page: caption dock only. Never a sheet/overlay.
  if (variant === 'inline' || variant === 'sheet') {
    return (
      <CaptionDock
        member={member}
        settings={settings}
        titleId={titleId}
        onPrev={onPrev}
        onNext={onNext}
      />
    );
  }

  const body = <SpotlightBody member={member} settings={settings} titleId={titleId} />;

  if (variant === 'docked') {
    return (
      <aside
        id="team-profile-modal"
        className="galaxy-docked-panel relative rounded-[22px]"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-11 h-11 rounded-full border border-[#D4AF37]/25 flex items-center justify-center text-[#E8D9B0]/80 hover:text-[#F7F1E4]"
          aria-label="סגירה"
        >
          <X className="w-4 h-4" />
        </button>
        {body}
        <div className="sticky bottom-0 bg-[#080705]/95 pt-1">
          <NavRow onPrev={onPrev} onNext={onNext} />
        </div>
      </aside>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="galaxy-spotlight-backdrop flex items-center justify-center p-4" onClick={onClose}>
        <div
          id="team-profile-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`relative w-full ${isFounder ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto rounded-2xl border border-[#D4AF37]/30 bg-[#080808]`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 z-10 w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white"
            aria-label="סגירה"
          >
            <X className="w-4 h-4" />
          </button>
          {body}
        </div>
      </div>
    );
  }

  return (
    <CaptionDock
      member={member}
      settings={settings}
      titleId={titleId}
      onPrev={onPrev}
      onNext={onNext}
    />
  );
}

function CaptionDock({
  member,
  settings,
  titleId,
  onPrev,
  onNext,
}: {
  member: TeamMember;
  settings: SpotlightPanelProps['settings'];
  titleId: string;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const name = localizedName(member, 'he');
  const roleHe = localizedRole(member, 'he');
  const line = member.contribution || member.bio || member.quote || '';
  const score = typeof member.impact_score === 'number' ? member.impact_score : null;
  const ticksOn = score == null ? 0 : Math.round((Math.max(0, Math.min(100, score)) / 100) * 10);

  return (
    <aside
      id="team-profile-card"
      className="galaxy-caption-dock"
      aria-live="polite"
      aria-labelledby={titleId}
    >
      <h3 id={titleId} className="text-[17px] text-[#F7F1E4] font-heading leading-snug">
        {name}
      </h3>
      <p className="mt-1 text-[12px] tracking-[0.16em] uppercase text-[#C5A059]" dir="ltr">
        {localizedRole(member, 'en') || roleHe}
      </p>
      {line ? (
        <p className="mt-2 text-[14px] text-[#F7F1E4]/75 font-light leading-snug line-clamp-2" dir="rtl">
          {line}
        </p>
      ) : null}
      {settings.show_impact && score != null ? (
        <div className="galaxy-caption-dock-impact" aria-label={`Impact ${score}`}>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`galaxy-caption-dock-tick${i < ticksOn ? ' is-on' : ''}`} />
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onPrev}
        className="absolute top-1/2 right-1 -translate-y-1/2 w-11 h-11 rounded-full text-[#D4AF37] flex items-center justify-center"
        aria-label="איש צוות קודם"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="absolute top-1/2 left-1 -translate-y-1/2 w-11 h-11 rounded-full text-[#D4AF37] flex items-center justify-center"
        aria-label="איש צוות הבא"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </aside>
  );
}

function NavRow({ onPrev, onNext, compact }: { onPrev?: () => void; onNext?: () => void; compact?: boolean }) {
  if (!onPrev && !onNext) return null;
  return (
    <div className={compact ? 'mt-0.5 flex items-center justify-center gap-8' : 'flex items-center justify-between px-5 pb-5'}>
      <button
        type="button"
        onClick={onPrev}
        className="w-11 h-11 rounded-full border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center"
        aria-label="איש צוות קודם"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="w-11 h-11 rounded-full border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center"
        aria-label="איש צוות הבא"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}

function SpotlightBody({
  member,
  settings,
  titleId,
}: {
  member: TeamMember;
  settings: SpotlightPanelProps['settings'];
  titleId: string;
}) {
  const isFounder = member.group_key === 'founder' || member.hierarchy_level === 'founder';
  const name = localizedName(member, 'he');
  const roleHe = localizedRole(member, 'he');
  const quote = member.quote || '';
  const vision = member.vision || (isFounder ? member.bio : '');
  const bio = isFounder ? '' : member.bio;
  const closing = member.closing_quote || '';

  return (
    <div className="p-7 text-right" dir="rtl">
      {isFounder && (
        <p className="text-[10px] tracking-[0.28em] text-[#D4AF37] mb-4 text-center uppercase">
          Founder & Visionary
        </p>
      )}
      <div className="flex justify-center mb-4">
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: isFounder ? 112 : 88,
            height: isFounder ? 112 : 88,
            border: '1.6px solid #D4AF37',
            boxShadow: '0 0 28px rgba(212,175,55,0.22)',
          }}
        >
          <GalaxyPortrait src={member.photo || undefined} name={name} alt={member.photo_alt || name} className="w-full h-full text-4xl" />
        </div>
      </div>
      <h3 id={titleId} className="text-xl text-[#F7F1E4] font-heading text-center mb-1">
        {name}
      </h3>
      <p className="text-sm text-[#C5A059] text-center mb-5 tracking-[0.06em]">
        {roleHe}
      </p>
      {settings.show_quotes && quote ? (
        <p className="text-sm text-[#F7F1E4]/75 font-light italic text-center leading-relaxed mb-5">“{quote}”</p>
      ) : null}

      {vision ? <Block label={isFounder ? 'VISION' : 'מי אני'} text={vision} /> : null}
      {bio && !isFounder ? <Block label="מי אני" text={bio} /> : null}
      <Block label={isFounder ? 'CONTRIBUTION' : 'התרומה שלי'} text={member.contribution} />
      <List label={isFounder ? 'KEY RESPONSIBILITIES' : 'תחומי אחריות'} items={member.responsibilities} />
      {settings.show_expertise ? <Tags items={member.expertise} /> : null}
      {settings.show_quotes && closing ? (
        <blockquote className="mt-5 pt-4 border-t border-[#D4AF37]/12 text-center">
          <p className="text-base text-white/55 font-light italic leading-relaxed">“{closing}”</p>
        </blockquote>
      ) : null}
      {settings.show_links && member.professional_url ? (
        <p className="mt-4 text-center">
          <a
            href={member.professional_url}
            className="text-base text-[#C5A059] underline min-h-11 inline-flex items-center"
            target="_blank"
            rel="noreferrer"
          >
            קישור מקצועי
          </a>
        </p>
      ) : null}
      {settings.show_impact && typeof member.impact_score === 'number' ? (
        <div className="mt-8 pt-4 border-t border-[#D4AF37]/12">
          <p className="text-center text-[10px] tracking-[0.18em] text-[#C5A059] mb-2">IMPACT</p>
          <div className="galaxy-impact-bar mx-auto max-w-[180px]" aria-hidden>
            <div className="galaxy-impact-fill" style={{ width: `${Math.max(0, Math.min(100, member.impact_score))}%` }} />
          </div>
          <p className="mt-2 text-center text-[12px] tracking-[0.12em] text-[#E8D9B0]/80">
            {member.impact_score} / 100
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Block({ label, text }: { label: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className="mb-5">
      <p className="text-[11px] tracking-[0.12em] text-[#C5A059] mb-2">{label}</p>
      <p className="text-[15px] text-[#F7F1E4]/80 font-light leading-relaxed" dir="rtl">
        {text}
      </p>
    </div>
  );
}

function List({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mb-5">
      <p className="text-[11px] tracking-[0.12em] text-[#C5A059] mb-2">{label}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-[15px] text-[#F7F1E4]/80 font-light flex gap-2">
            <span className="text-[#D4AF37]">·</span>
            <span dir="rtl">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tags({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mb-5">
      <p className="text-[11px] tracking-[0.12em] text-[#C5A059] mb-2">מומחיות</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="px-3 py-1 rounded-full border border-[#D4AF37]/20 text-xs text-[#E8D9B0]/75" dir="rtl">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
