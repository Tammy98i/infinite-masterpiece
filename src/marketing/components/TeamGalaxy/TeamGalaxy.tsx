import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  TEAM_ECOSYSTEM,
  TEAM_SECTION_DEFAULTS,
  localizedName,
  localizedRole,
  teamGalaxyPublicMembers,
  type TeamSectionSettings,
} from '../../../constants/teamGalaxySeed';
import { teamMembersApi, type TeamMember } from '../../../api/teamMembers';
import { GalaxyPortrait } from './GalaxyPortrait';
import { SpotlightPanel } from './SpotlightPanel';
import './galaxy.css';

const RING_DEG = [270, 330, 30, 90, 150, 210, 240, 300, 0];

function tierSize(tier: string | undefined, founder: boolean): number {
  if (founder || tier === 'hero') return 168;
  if (tier === 'large') return 104;
  if (tier === 'small') return 72;
  return 88;
}

function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440));
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

type PreviewPayload = {
  settings?: TeamSectionSettings;
  members?: TeamMember[];
};

export function TeamGalaxy({ preview }: { preview?: PreviewPayload }) {
  const seedMembers = useMemo(() => teamGalaxyPublicMembers() as TeamMember[], []);
  const [fetchedMembers, setFetchedMembers] = useState<TeamMember[]>(seedMembers);
  const [fetchedSettings, setFetchedSettings] = useState<TeamSectionSettings>(TEAM_SECTION_DEFAULTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const viewportWidth = useViewportWidth();

  useEffect(() => {
    if (preview) return;
    teamMembersApi
      .publicSection('he')
      .then((payload) => {
        if (payload.members?.length) setFetchedMembers(payload.members);
        if (payload.settings) setFetchedSettings({ ...TEAM_SECTION_DEFAULTS, ...payload.settings });
      })
      .catch(() => {
        setFetchedMembers(seedMembers);
        setFetchedSettings(TEAM_SECTION_DEFAULTS);
      });
  }, [preview, seedMembers]);

  const members = preview?.members ?? fetchedMembers;
  const settings = preview?.settings ?? fetchedSettings;

  const people = useMemo(
    () =>
      members
        .filter((m) => m.group_key !== 'ecosystem')
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [members],
  );

  const founder = people.find((m) => m.group_key === 'founder' || m.hierarchy_level === 'founder') ?? people[0];
  const featured = people.filter((m) => m.featured).slice(0, 10);
  const ring = featured.filter((m) => m.id !== founder?.id);
  const secondary = people.filter((m) => !featured.some((f) => f.id === m.id));
  const mobileLead = people
    .filter((m) => m.group_key === 'founder' || m.group_key === 'leadership' || m.hierarchy_level === 'founder' || m.hierarchy_level === 'leadership')
    .slice(0, 2);

  useEffect(() => {
    if (!selectedId && founder) setSelectedId(founder.id);
  }, [founder, selectedId]);

  const selected = people.find((m) => m.id === selectedId) ?? founder ?? null;
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1180;

  const cycle = (dir: number) => {
    if (!people.length) return;
    const idx = Math.max(0, people.findIndex((m) => m.id === selectedId));
    setSelectedId(people[(idx + dir + people.length) % people.length].id);
  };

  const select = (m: TeamMember, btn?: HTMLButtonElement | null) => {
    setSelectedId(m.id);
    if (isMobile) {
      triggerRef.current = btn ?? null;
      setSheetOpen(true);
    }
  };

  const navProps = { onPrev: () => cycle(-1), onNext: () => cycle(1) };
  const spotlightSettings = {
    show_impact: settings.show_impact,
    show_quotes: settings.show_quotes,
    show_expertise: settings.show_expertise,
    show_links: settings.show_links,
  };

  return (
    <section id="webinar-people" className="relative py-16 md:py-20 overflow-x-hidden" dir="rtl">
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-10 md:mb-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#C5A059]/90 mb-3" dir="ltr">
            {settings.title_en}
          </p>
          <h2 className="text-[28px] sm:text-[32px] md:text-5xl font-heading text-white leading-tight">
            {settings.title_he}
          </h2>
          <p className="mt-3 text-base text-white/70 font-light">{settings.subtitle_he}</p>
        </header>

        {isMobile ? (
          <MobileLayout
            founder={founder}
            people={showAll ? people : mobileLead.length ? mobileLead : people.slice(0, 2)}
            showAll={showAll}
            remaining={Math.max(0, people.length - 2)}
            onShowAll={() => setShowAll(true)}
            showAllLabel={settings.show_all_label}
            hint={settings.mobile_hint}
            selectedId={selectedId}
            onSelect={select}
          />
        ) : isTablet ? (
          <div className="flex flex-col gap-8">
            <PersonGrid people={people} selectedId={selectedId} onSelect={(m) => select(m)} columns={3} />
            <SpotlightPanel member={selected} settings={spotlightSettings} variant="inline" {...navProps} />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-12 xl:col-span-8 space-y-10">
              <DesktopRing
                founder={founder}
                ring={ring}
                selectedId={selectedId}
                onSelect={(m) => select(m)}
              />
              {secondary.length > 0 ? (
                <div>
                  <p className="text-center text-sm text-white/50 mb-5">שאר הצוות</p>
                  <PersonGrid people={secondary} selectedId={selectedId} onSelect={(m) => select(m)} columns={4} />
                </div>
              ) : null}
            </div>
            <div className="col-span-12 xl:col-span-4 xl:sticky xl:top-28">
              <SpotlightPanel member={selected} settings={spotlightSettings} variant="docked" {...navProps} />
            </div>
          </div>
        )}

        <EcosystemRow label={settings.ecosystem_label_he} />
      </div>

      {isMobile && sheetOpen ? (
        <SpotlightPanel
          member={selected}
          settings={spotlightSettings}
          variant="sheet"
          onClose={() => {
            setSheetOpen(false);
            triggerRef.current?.focus();
          }}
          {...navProps}
        />
      ) : null}
    </section>
  );
}

function DesktopRing({
  founder,
  ring,
  selectedId,
  onSelect,
}: {
  founder?: TeamMember;
  ring: TeamMember[];
  selectedId: string | null;
  onSelect: (m: TeamMember) => void;
}) {
  return (
    <div
      className="relative mx-auto galaxy-orbit-map"
      style={{ width: 'min(100%, 640px)', aspectRatio: '1 / 1' }}
      role="radiogroup"
      aria-label="הצוות המוביל"
    >
      <div className="absolute inset-[12%] rounded-full border border-[#D4AF37]/20 pointer-events-none" aria-hidden />
      <div className="absolute inset-[4%] rounded-full border border-[#D4AF37]/10 pointer-events-none" aria-hidden />
      {founder && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <PersonButton member={founder} selected={selectedId === founder.id} onSelect={onSelect} />
        </div>
      )}
      {ring.map((m, i) => {
        const deg = RING_DEG[i] ?? (i * 360) / ring.length;
        const rad = (deg * Math.PI) / 180;
        const radius = ring.length > 6 ? 40 : 38;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        return (
          <div
            key={m.id}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `translate(calc(-50% + ${x}%), calc(-50% + ${y}%))` }}
          >
            <PersonButton member={m} selected={selectedId === m.id} onSelect={onSelect} uniform={ring.length > 6 ? 72 : undefined} />
          </div>
        );
      })}
    </div>
  );
}

function PersonGrid({
  people,
  selectedId,
  onSelect,
  columns,
}: {
  people: TeamMember[];
  selectedId: string | null;
  onSelect: (m: TeamMember) => void;
  columns: 2 | 3 | 4;
}) {
  return (
    <div
      className={`grid gap-4 sm:gap-6 ${columns === 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
      role="radiogroup"
      aria-label="צוות"
    >
      {people.map((m) => (
        <div key={m.id}>
          <PersonButton member={m} selected={selectedId === m.id} onSelect={onSelect} uniform={columns === 4 ? 80 : 104} />
        </div>
      ))}
    </div>
  );
}

function MobileLayout({
  founder,
  people,
  showAll,
  remaining,
  onShowAll,
  showAllLabel,
  hint,
  selectedId,
  onSelect,
}: {
  founder?: TeamMember;
  people: TeamMember[];
  showAll: boolean;
  remaining: number;
  onShowAll: () => void;
  showAllLabel: string;
  hint: string;
  selectedId: string | null;
  onSelect: (m: TeamMember, btn?: HTMLButtonElement | null) => void;
}) {
  return (
    <div>
      <p className="text-base text-white/55 text-center mb-6">{hint}</p>
      <div className="grid grid-cols-2 gap-5" role="radiogroup" aria-label="צוות">
        {people.map((m) => (
          <div key={m.id}>
            <PersonButton
              member={m}
              selected={selectedId === m.id}
              onSelect={onSelect}
              uniform={m.id === founder?.id ? 112 : 96}
            />
          </div>
        ))}
      </div>
      {!showAll && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={onShowAll}
            className="min-h-11 px-5 rounded-full border border-[#D4AF37]/40 text-[#F7E7B5] text-base"
          >
            {showAllLabel}
            {remaining > 0 ? ` (${remaining})` : ''}
          </button>
        </div>
      )}
    </div>
  );
}

function PersonButton({
  member,
  selected,
  onSelect,
  uniform,
}: {
  member: TeamMember;
  selected: boolean;
  onSelect: (m: TeamMember, btn?: HTMLButtonElement | null) => void;
  uniform?: number;
}): ReactNode {
  const founder = member.group_key === 'founder' || member.hierarchy_level === 'founder';
  const size = uniform ?? tierSize(member.visual_tier, founder);
  const name = localizedName(member, 'he');
  const role = localizedRole(member, 'en');
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-pressed={selected}
      aria-label={`${name}, ${role}${selected ? ', נבחר' : ''}`}
      onClick={(e) => onSelect(member, e.currentTarget)}
      className="flex flex-col items-center gap-2 min-w-0 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-xl p-1 galaxy-person-btn"
    >
      <span
        className="rounded-full overflow-hidden shrink-0"
        style={{
          width: size,
          height: size,
          border: `${selected ? 3 : 2}px solid ${selected ? '#F4D03F' : '#D4AF37'}`,
          boxShadow: selected ? '0 0 0 4px rgba(212,175,55,0.18)' : 'none',
          background: selected ? 'rgba(212,175,55,0.08)' : 'transparent',
        }}
      >
        <GalaxyPortrait
          src={member.photo || undefined}
          name={name}
          alt={member.photo_alt || name}
          className="w-full h-full text-3xl"
        />
      </span>
      <span className="text-center min-w-0 w-full px-1">
        <span className="block text-white text-base sm:text-[16px] leading-snug line-clamp-2">{name}</span>
        <span className="block text-[#C5A059] text-sm leading-snug line-clamp-2" dir="ltr">
          {role}
        </span>
      </span>
    </button>
  );
}

function EcosystemRow({ label }: { label: string }) {
  return (
    <div className="mt-14 pt-8 border-t border-white/8">
      <p className="text-center text-sm text-white/55 mb-6">{label}</p>
      <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[#C5A059]">
        {TEAM_ECOSYSTEM.map((item) => (
          <li key={item.id} className="text-sm tracking-wide min-h-11 flex items-center">
            {item.label_he}
            <span className="sr-only"> / {item.label_en}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
