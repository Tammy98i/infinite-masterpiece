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
import {
  calculatePositions,
  getConnectionLines,
  goldColor,
  isCtoOrCco,
  mobileStarDiameter,
} from './galaxyUtils';
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

export function TeamGalaxy({
  preview,
  variant = 'embed',
  sectionId,
}: {
  preview?: PreviewPayload;
  variant?: 'embed' | 'stage';
  sectionId?: string;
}) {
  const seedMembers = useMemo(() => teamGalaxyPublicMembers() as TeamMember[], []);
  const [fetchedMembers, setFetchedMembers] = useState<TeamMember[]>(seedMembers);
  const [settings, setSettings] = useState<TeamSectionSettings>(preview?.settings ?? TEAM_SECTION_DEFAULTS);
  const [pinned, setPinned] = useState<TeamMember | null>(null);
  const [hovered, setHovered] = useState<TeamMember | null>(null);
  const selected = pinned || hovered;
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
        isTablet ? 0.78 : variant === 'stage' ? 0.92 : 0.88,
        Math.max(0.55, (viewport.w - 80) / 1280),
        Math.max(0.55, (viewport.h - 250) / 920),
      );
  const maxOrbit = isTablet ? 2 : 3;

  const { stars, orbitRadii } = useMemo(
    () => calculatePositions(members, scale, { maxOrbit }),
    [members, scale, maxOrbit],
  );
  const connections = useMemo(() => getConnectionLines(stars), [stars]);
  const anchorId = sectionId || (variant === 'stage' ? 'people-galaxy' : 'webinar-people');
  const containerSize = useMemo(() => {
    const maxR = orbitRadii[orbitRadii.length - 1] || 518;
    return maxR * 2 + 140;
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

  const browseOrder = useMemo(
    () => [...members].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [members],
  );

  const previewMember = (m: TeamMember | null) => {
    if (!pinned) setHovered(m);
  };
  const select = (m: TeamMember, trigger?: HTMLButtonElement | null) => {
    if (trigger) triggerRef.current = trigger;
    setPinned((current) => (current?.id === m.id ? null : m));
    setHovered(null);
  };
  const close = () => {
    setPinned(null);
    setHovered(null);
    triggerRef.current?.focus();
  };
  const step = (dir: 1 | -1) => {
    if (!selected || browseOrder.length < 2) return;
    const i = browseOrder.findIndex((m) => m.id === selected.id);
    const next = browseOrder[(i + dir + browseOrder.length) % browseOrder.length];
    if (next) {
      setPinned(next);
      setHovered(null);
    }
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, browseOrder]);

  const spotlight = (
    <SpotlightPanel
      member={selected}
      settings={{
        show_impact: settings.show_impact,
        show_quotes: settings.show_quotes,
        show_expertise: settings.show_expertise,
        show_links: settings.show_links,
      }}
      variant={isMobile ? 'inline' : 'docked'}
      onClose={close}
      onPrev={() => step(-1)}
      onNext={() => step(1)}
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
        sectionId={anchorId}
        variant={variant}
      />
    );
  }

  return (
    <section
      ref={sectionRef}
      id={anchorId}
      className={`galaxy-stage relative overflow-hidden scroll-mt-24 ${variant === 'stage' ? 'is-page' : ''}`}
      dir="rtl"
    >
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

      <div className="relative z-20 text-center px-4 pt-16 pb-1">
        <p className="text-[10px] tracking-[0.42em] text-[#C5A059]/80 uppercase mb-3" dir="ltr">
          Infinite Masterpiece
        </p>
        <motion.h2
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="font-heading text-[26px] md:text-[38px] text-[#F7F1E4] tracking-[0.12em] uppercase"
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
        <p className="mt-3 text-[15px] text-[#F7F1E4]/70">{settings.title_he}</p>
        <p className="mt-1 text-[13px] text-[#C5A059]">{settings.subtitle_he}</p>
        <p className="mt-3 text-[13px] text-[#C5A059]/80">לחצו או רחפו על אדם כדי להכיר</p>
      </div>

      <div className="relative z-10 flex items-center justify-center px-4 pt-1 pb-28">
        <div
          className="relative mx-auto"
          style={{ width: containerSize, height: containerSize, maxWidth: '100%' }}
          onClick={(e) => {
            if (pinned && e.target === e.currentTarget) close();
          }}
          onMouseLeave={() => {
            if (!pinned) setHovered(null);
          }}
        >
          {orbitRadii.slice(1).map((r, i) => (
            <motion.div
              key={r}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.9, delay: reducedMotion ? 0 : 0.85 + i * 0.16, ease: [0.16, 1, 0.3, 1] }}
              className={`galaxy-orbit-ring ${i === 1 ? 'is-faded' : ''}`}
              style={{ width: r * 2, height: r * 2, animationDuration: `${180 + i * 40}s` }}
            />
          ))}

          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            {inView &&
              connections.map((line) => (
                <line
                  key={`${line.from.member.id}-${line.to.member.id}`}
                  x1={containerSize / 2 + line.from.x}
                  y1={containerSize / 2 + line.from.y}
                  x2={containerSize / 2 + line.to.x}
                  y2={containerSize / 2 + line.to.y}
                  stroke="rgba(212,175,55,0.16)"
                  strokeWidth="1"
                />
              ))}
          </svg>

          {inView &&
            stars.map((star) => (
              <Fragment key={star.member.id}>
                <StarNode
                  star={star}
                  onClick={select}
                  onHover={previewMember}
                  delay={starDelays.get(star.member.id) || 0}
                  selected={selected?.id === star.member.id}
                  dimmed={Boolean(pinned && pinned.id !== star.member.id)}
                  reducedMotion={reducedMotion}
                />
              </Fragment>
            ))}
        </div>

        {selected ? (
          <div className="z-30 max-lg:relative max-lg:px-4 max-lg:mt-4 lg:absolute lg:top-8 lg:right-4">{spotlight}</div>
        ) : null}
      </div>

      <div className="galaxy-legend hidden md:block" aria-label="מקרא גודל הכוכבים">
        <p className="galaxy-legend-item">
          <span>מייסד</span>
          <span className="galaxy-legend-mark" aria-hidden>
            ✦
          </span>
        </p>
        <p className="galaxy-legend-item">
          <span>הנהלה</span>
          <span className="galaxy-legend-mark" aria-hidden>
            ✦
          </span>
        </p>
        <p className="galaxy-legend-item">
          <span>צוות ליבה</span>
          <span className="galaxy-legend-mark" aria-hidden>
            ✦
          </span>
        </p>
        <p className="galaxy-legend-item">
          <span>שותפים</span>
          <span className="galaxy-legend-mark" aria-hidden>
            ✦
          </span>
        </p>
        <p className="mt-2 pt-2 border-t border-[#D4AF37]/15 text-[10px] tracking-[0.08em] text-[#C5A059]/90" dir="ltr">
          Star size = Impact level
        </p>
      </div>

      <p className="relative z-10 mt-2 mb-6 px-6 text-center text-[13px] text-[#B8976A]/85">
        גודל הכוכב משקף את עוצמת התרומה
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
  sectionId,
  variant,
}: {
  members: TeamMember[];
  settings: TeamSectionSettings;
  onSelect: (m: TeamMember, trigger?: HTMLButtonElement | null) => void;
  sectionRef: RefObject<HTMLElement | null>;
  spotlight: ReactNode;
  selectedId?: string;
  sectionId: string;
  variant: 'embed' | 'stage';
}) {
  const founder = members.find((m) => m.hierarchy_level === 'founder' || m.group_key === 'founder');
  const innerLead = members
    .filter((m) => m !== founder && isCtoOrCco(m))
    .sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0));
  const rest = members
    .filter((m) => m !== founder && !innerLead.includes(m))
    .sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0));

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      className={`galaxy-stage relative py-16 overflow-x-hidden scroll-mt-24 ${variant === 'stage' ? 'is-page' : ''}`}
      dir="rtl"
    >
      <div className="galaxy-vignette" aria-hidden />
      <div className="relative z-10 text-center mb-8 px-4">
        <p className="text-[10px] tracking-[0.42em] text-[#C5A059]/80 uppercase mb-3" dir="ltr">
          Infinite Masterpiece
        </p>
        <h2 className="text-[26px] font-heading text-[#F7F1E4] uppercase tracking-[0.12em]" dir="ltr">
          {settings.title_en}
        </h2>
        <p className="text-[14px] text-[#E8D9B0]/80 font-light mt-2 tracking-[0.06em]" dir="ltr">
          {settings.subtitle_en}
        </p>
        <p className="mt-3 text-[15px] text-[#F7F1E4]/70">{settings.title_he}</p>
        <p className="mt-2 text-[13px] text-[#C5A059]">{settings.mobile_hint}</p>
      </div>

      {founder ? (
        <div className="relative z-10 flex justify-center mb-8">
          <MobileStar member={founder} onClick={(el) => onSelect(founder, el)} selected={selectedId === founder.id} />
        </div>
      ) : null}

      {innerLead.length > 0 ? (
        <div className="galaxy-mobile-inner relative z-10">
          {innerLead.map((m) => (
            <div key={m.id}>
              <MobileStar
                member={m}
                onClick={(el) => onSelect(m, el)}
                selected={selectedId === m.id}
              />
            </div>
          ))}
        </div>
      ) : null}

      {spotlight}

      {rest.length > 0 ? (
        <div className="relative z-10">
          <p className="galaxy-mobile-rest-label">שאר הצוות · גודל הכוכב = רמת ההשפעה</p>
          <div className="flex gap-5 overflow-x-auto px-4 pb-6 galaxy-mobile-scroller" style={{ scrollSnapType: 'x mandatory' }}>
            {rest.map((m) => (
              <div key={m.id} className="galaxy-mobile-card shrink-0">
                <MobileStar member={m} onClick={(el) => onSelect(m, el)} selected={selectedId === m.id} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
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
  onClick: (trigger: HTMLButtonElement) => void;
  size?: number;
  selected?: boolean;
}) {
  const isFounder = member.hierarchy_level === 'founder' || member.group_key === 'founder';
  const d = size ?? mobileStarDiameter(member, isFounder);
  const color = goldColor(member.hierarchy_level);
  const name = localizedName(member, 'he') || member.name;
  const role = localizedRole(member, 'he') || localizedRole(member, 'en') || member.role;

  return (
    <button type="button" onClick={(e) => onClick(e.currentTarget)} className="flex flex-col items-center cursor-pointer min-h-11 min-w-11" aria-pressed={Boolean(selected)} aria-label={`${name}, ${role}`}>
      <span
        className="relative flex items-center justify-center"
        style={{ width: d, height: d }}
      >
          {isFounder ? (
            <>
              <span className="galaxy-founder-corona" style={{ width: d * 2.4, height: d * 2.4 }} />
              <span className="galaxy-founder-rays" style={{ width: d * 2.6, height: d * 2.6 }} />
              <span className="galaxy-founder-glow" style={{ width: d * 2, height: d * 2 }} />
            </>
          ) : (
            <span
              className="galaxy-star-glow"
              style={{ width: d * 1.45, height: d * 1.45, opacity: selected ? 0.5 : 0.22 }}
            />
          )}
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
