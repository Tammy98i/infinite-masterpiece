import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { motion } from 'motion/react';
import { teamMembersApi, type TeamMember } from '../../../api/teamMembers';
import {
  TEAM_SECTION_DEFAULTS,
  localizedName,
  localizedRole,
  teamGalaxyPublicMembers,
  type TeamSectionSettings,
} from '../../../constants/teamGalaxySeed';
import { GalaxyPortrait } from './GalaxyPortrait';
import { StarNode } from './StarNode';
import { SpotlightPanel } from './SpotlightPanel';
import { calculatePositions, goldColor, isCtoOrCco, isLeadership, starDiameter } from './galaxyUtils';
import './galaxy.css';

function useViewport() {
  const read = () =>
    typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight } : { w: 1200, h: 800 };
  const [v, setV] = useState(read);
  useEffect(() => {
    const handler = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return v;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches || document.documentElement.classList.contains('a11y-reduce-motion'));
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

function entranceDelay(orbit: number, indexInOrbit: number): number {
  if (orbit === 0) return 0.45;
  if (orbit === 1) return 1.15 + indexInOrbit * 0.12;
  if (orbit === 2) return 1.7 + indexInOrbit * 0.07;
  return 2.2 + indexInOrbit * 0.05;
}

type PreviewPayload = {
  settings?: TeamSectionSettings;
  members?: TeamMember[];
};

export function TeamGalaxy({ preview }: { preview?: PreviewPayload }) {
  const seedMembers = useMemo(() => teamGalaxyPublicMembers() as TeamMember[], []);
  const [fetchedMembers, setFetchedMembers] = useState<TeamMember[]>(seedMembers);
  const [settings, setSettings] = useState<TeamSectionSettings>(preview?.settings ?? TEAM_SECTION_DEFAULTS);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [inView, setInView] = useState(Boolean(preview));
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const viewport = useViewport();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (preview) {
      setFetchedMembers(preview.members?.length ? preview.members : seedMembers);
      setSettings(preview.settings ?? TEAM_SECTION_DEFAULTS);
      return;
    }
    teamMembersApi
      .publicSection('he')
      .then((payload) => {
        if (payload.members?.length) setFetchedMembers(payload.members);
        if (payload.settings) setSettings({ ...TEAM_SECTION_DEFAULTS, ...payload.settings });
      })
      .catch(() => {
        setFetchedMembers(seedMembers);
        setSettings(TEAM_SECTION_DEFAULTS);
      });
  }, [preview, seedMembers]);

  const members = useMemo((): TeamMember[] => {
    const source = preview?.members ?? fetchedMembers;
    const seedById = new Map<string, TeamMember>(seedMembers.map((m) => [m.id, m]));
    return source.map((m) => {
      const seed = seedById.get(m.id);
      return {
        ...m,
        photo: m.photo || seed?.photo || '',
        photo_alt: m.photo_alt || seed?.photo_alt || '',
      };
    });
  }, [preview?.members, fetchedMembers, seedMembers]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || preview) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [preview]);

  const isMobile = viewport.w < 768;
  const isTablet = viewport.w >= 768 && viewport.w < 1100;
  const scale = isMobile
    ? 1
    : Math.min(
        isTablet ? 0.82 : 1,
        Math.max(0.62, (viewport.w - (isTablet ? 48 : 280)) / 1280),
        Math.max(0.62, (viewport.h - 160) / 1080),
      );

  const { stars, orbitRadii } = useMemo(() => calculatePositions(members, scale), [members, scale]);
  const containerSize = useMemo(() => {
    const maxR = orbitRadii[3] || 518;
    return maxR * 2 + 120;
  }, [orbitRadii]);

  const dust = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        left: (i * 37) % 100,
        top: (i * 53) % 100,
        delay: (i % 7) * 0.6,
        duration: 8 + (i % 6),
        size: i % 5 === 0 ? 2.2 : 1.2,
      })),
    [],
  );

  const starDelays = useMemo(() => {
    const counters = new Map<number, number>();
    const delays = new Map<string, number>();
    for (const s of stars) {
      const o = s.member.orbit ?? 2;
      const idx = counters.get(o) || 0;
      counters.set(o, idx + 1);
      delays.set(s.member.id, entranceDelay(o, idx));
    }
    return delays;
  }, [stars]);

  const select = (m: TeamMember) => setSelected(m);
  const close = () => {
    setSelected(null);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const spotlight = (
    <SpotlightPanel
      member={selected}
      settings={{
        show_impact: settings.show_impact,
        show_quotes: settings.show_quotes,
        show_expertise: settings.show_expertise,
        show_links: settings.show_links,
      }}
      variant={isMobile ? 'sheet' : 'docked'}
      onClose={close}
    />
  );

  if (isMobile) {
    return (
      <TeamGalaxyMobile
        members={members}
        settings={settings}
        onSelect={select}
        sectionRef={sectionRef}
        spotlight={spotlight}
        selectedId={selected?.id}
      />
    );
  }

  const selectedStar = selected ? stars.find((s) => s.member.id === selected.id) : null;
  const founderStar = stars.find((s) => s.isFounder);
  const center = containerSize / 2;

  return (
    <section ref={sectionRef} id="webinar-people" className="galaxy-stage relative overflow-hidden scroll-mt-24 min-h-[100svh]" dir="rtl">
      <div className="galaxy-vignette" aria-hidden />
      {dust.map((s) => (
        <span
          key={s.id}
          className={s.id % 3 === 0 ? 'galaxy-gold-dust' : 'galaxy-bg-star'}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      <div className="absolute z-20 top-20 md:top-24 left-0 right-0 text-center px-4 pointer-events-none">
        <motion.h2
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="font-heading text-[26px] md:text-[40px] text-[#F7F1E4] tracking-[0.14em] uppercase"
          dir="ltr"
        >
          {settings.title_en}
        </motion.h2>
        <motion.p
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-2 text-[13px] md:text-[16px] font-light tracking-[0.08em] text-[#E8D9B0]/80"
          dir="ltr"
        >
          {settings.subtitle_en}
        </motion.p>
      </div>

      <div className={`relative z-10 flex items-center justify-center gap-6 px-4 min-h-[100svh] pt-28 pb-24 ${selected ? 'lg:pl-2' : ''}`} dir="ltr">
        <div className="relative mx-auto" style={{ width: containerSize, height: containerSize, maxWidth: '100%' }}>
          {orbitRadii.slice(1).map((r, i) => (
            <motion.div
              key={r}
              initial={reducedMotion ? false : { scale: 0.92, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.9, delay: reducedMotion ? 0 : 0.85 + i * 0.16, ease: [0.16, 1, 0.3, 1] }}
              className={`galaxy-orbit-ring ${i === 1 ? 'is-faded' : ''}`}
              style={{ width: r * 2, height: r * 2 }}
            />
          ))}

          {inView && selectedStar && founderStar && selectedStar !== founderStar ? (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${containerSize} ${containerSize}`} aria-hidden>
              <line
                x1={center}
                y1={center}
                x2={center + selectedStar.x}
                y2={center + selectedStar.y}
                stroke="rgba(212,175,55,0.35)"
                strokeWidth="0.8"
              />
            </svg>
          ) : null}

          {inView &&
            stars.map((star) => (
              <Fragment key={star.member.id}>
                <StarNode
                  star={star}
                  onClick={select}
                  delay={starDelays.get(star.member.id) || 0}
                  selected={selected?.id === star.member.id}
                  dimmed={Boolean(selected && selected.id !== star.member.id)}
                  reducedMotion={reducedMotion}
                />
              </Fragment>
            ))}
        </div>

        {selected ? (
          <div className="hidden lg:block sticky top-28 shrink-0">{spotlight}</div>
        ) : null}
      </div>

      {selected && !isMobile ? <div className="lg:hidden relative z-20 px-4 mt-4">{spotlight}</div> : null}

      <p className="relative z-10 mt-4 mb-2 px-6 text-center text-[10px] tracking-[0.16em] uppercase text-[#B8976A]/80" dir="ltr">
        Founder — Sun · Leadership — Large star · Core — Medium · Contributors — Small
        <span className="block mt-1 font-light tracking-[0.12em] normal-case">Star size represents contribution &amp; impact</span>
      </p>
    </section>
  );
}

function TeamGalaxyMobile({
  members,
  settings,
  onSelect,
  sectionRef,
  spotlight,
  selectedId,
}: {
  members: TeamMember[];
  settings: TeamSectionSettings;
  onSelect: (m: TeamMember) => void;
  sectionRef: RefObject<HTMLElement | null>;
  spotlight: ReactNode;
  selectedId?: string;
}) {
  const founder = members.find((m) => m.hierarchy_level === 'founder' || m.group_key === 'founder');
  const leadership = members
    .filter((m) => m !== founder && isLeadership(m))
    .sort((a, b) => Number(isCtoOrCco(b)) - Number(isCtoOrCco(a)));
  const rest = members.filter((m) => m !== founder && !leadership.includes(m));

  return (
    <section ref={sectionRef} id="webinar-people" className="galaxy-stage relative py-16 overflow-x-hidden scroll-mt-24" dir="rtl">
      <div className="galaxy-vignette" aria-hidden />
      <div className="relative z-10 text-center mb-8 px-4">
        <h2 className="text-[26px] font-heading text-[#F7F1E4] uppercase tracking-[0.12em]" dir="ltr">
          {settings.title_en}
        </h2>
        <p className="text-[14px] text-[#E8D9B0]/80 font-light mt-2 tracking-[0.06em]" dir="ltr">
          {settings.subtitle_en}
        </p>
      </div>

      {founder ? (
        <div className="relative z-10 flex justify-center mb-8">
          <MobileStar member={founder} size={120} onClick={() => onSelect(founder)} selected={selectedId === founder.id} />
        </div>
      ) : null}

      {leadership.length > 0 ? (
        <div className="relative z-10 flex justify-center gap-5 mb-8 px-4 flex-wrap">
          {leadership.map((m) => (
            <div key={m.id}>
              <MobileStar
                member={m}
                size={isCtoOrCco(m) ? 86 : 64}
                onClick={() => onSelect(m)}
                selected={selectedId === m.id}
              />
            </div>
          ))}
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="relative z-10">
          <div className="flex gap-5 overflow-x-auto px-4 pb-6 galaxy-mobile-scroller" style={{ scrollSnapType: 'x mandatory' }}>
            {rest.map((m) => (
              <div key={m.id} className="galaxy-mobile-card shrink-0">
                <MobileStar member={m} onClick={() => onSelect(m)} selected={selectedId === m.id} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {spotlight}
    </section>
  );
}

function MobileStar({
  member,
  onClick,
  size,
  selected,
}: {
  member: TeamMember;
  onClick: () => void;
  size?: number;
  selected?: boolean;
}) {
  const isFounder = member.hierarchy_level === 'founder' || member.group_key === 'founder';
  const d = size ?? Math.min(starDiameter(member.impact_score, member, isFounder), 76);
  const color = goldColor(member.hierarchy_level);
  const name = localizedName(member, 'he') || member.name;
  const role = localizedRole(member, 'en') || member.role;

  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center cursor-pointer min-h-11 min-w-11" aria-pressed={Boolean(selected)} aria-label={`${name}, ${role}`}>
      <span className="relative flex items-center justify-center" style={{ width: d, height: d }}>
        {isFounder ? (
          <>
            <span className="galaxy-founder-corona" style={{ width: d * 2.4, height: d * 2.4 }} />
            <span className="galaxy-founder-glow" style={{ width: d * 2, height: d * 2 }} />
          </>
        ) : null}
      <span
        className="relative rounded-full overflow-hidden"
        style={{
          width: d,
          height: d,
          border: `1.6px solid ${color}`,
          boxShadow: `inset 0 0 14px rgba(244,208,63,0.2), 0 0 ${isFounder ? 28 : 12}px rgba(212,175,55,${isFounder ? 0.45 : 0.2})`,
        }}
      >
        <GalaxyPortrait src={member.photo || undefined} name={name} alt={member.photo_alt || name} className="w-full h-full" />
      </span>
      </span>
      <span className="text-[#F7F1E4] text-[15px] font-medium mt-1.5 text-center max-w-[96px] leading-snug">{name}</span>
      <span className="text-[12px] text-center max-w-[96px] leading-snug" style={{ color }} dir="ltr">
        {isFounder ? 'FOUNDER & VISIONARY' : role}
      </span>
    </button>
  );
}
