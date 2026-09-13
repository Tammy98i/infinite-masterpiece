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
  const name = member ? localizedName(member, 'he') : '';
  const roleEn = member ? localizedRole(member, 'en') : '';

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

  const body = <SpotlightBody member={member} settings={settings} titleId={titleId} />;

  if (variant === 'inline') {
    return (
      <aside className="w-full rounded-2xl border border-[#D4AF37]/28 bg-[#080705]/90 p-1" aria-live="polite">
        {body}
        <NavRow onPrev={onPrev} onNext={onNext} />
      </aside>
    );
  }

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
        <NavRow onPrev={onPrev} onNext={onNext} />
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
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        id="team-profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-h-[92dvh] rounded-t-3xl border border-[#D4AF37]/25 bg-[#080705] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center pt-3">
          <div className="h-1.5 w-12 rounded-full bg-white/25" aria-hidden />
        </div>
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#080705]">
          <p className="text-sm text-white">{isFounder ? 'מייסד וחזון' : 'פרופיל'}</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white"
            aria-label="סגירה"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(92dvh-4.5rem)]">
          {body}
          <NavRow onPrev={onPrev} onNext={onNext} />
        </div>
      </div>
    </div>
  );
}

function NavRow({ onPrev, onNext }: { onPrev?: () => void; onNext?: () => void }) {
  if (!onPrev && !onNext) return null;
  return (
    <div className="flex items-center justify-between px-5 pb-5">
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
  const roleEn = localizedRole(member, 'en');
  const quote = member.quote || '';
  const vision = member.vision || (isFounder ? member.bio : '');
  const bio = isFounder ? '' : member.bio;
  const closing = member.closing_quote || '';

  return (
    <div className="p-7 text-left" dir="ltr">
      {isFounder && (
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37] mb-4 text-center">
          Founder &amp; Visionary
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
      <p className="text-sm text-[#C5A059] text-center mb-5 uppercase tracking-[0.12em]">
        {roleEn}
      </p>
      {settings.show_quotes && quote ? (
        <p className="text-sm text-[#F7F1E4]/75 font-light italic text-center leading-relaxed mb-5">“{quote}”</p>
      ) : null}

      {vision ? <Block label="Who I am" text={vision} /> : null}
      {bio && !isFounder ? <Block label="Who I am" text={bio} /> : null}
      <Block label="My contribution" text={member.contribution} />
      <List label="Key responsibilities" items={member.responsibilities} />
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
      {typeof member.impact_score === 'number' ? (
        <p className="mt-8 pt-4 border-t border-[#D4AF37]/12 text-center text-[10px] uppercase tracking-[0.2em] text-[#B8976A]/85">
          Impact {member.impact_score}
        </p>
      ) : null}
    </div>
  );
}

function Block({ label, text }: { label: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className="mb-5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#C5A059] mb-2">{label}</p>
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
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#C5A059] mb-2">{label}</p>
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
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#C5A059] mb-2">Expertise</p>
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
