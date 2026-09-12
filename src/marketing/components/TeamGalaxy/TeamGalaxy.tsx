import { useEffect, useMemo, useRef, useState, Fragment, type ReactNode, type RefObject } from 'react';
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
import { calculatePositions, getConnectionLines, starDiameter, goldColor } from './galaxyUtils';
import './galaxy.css';

function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return w;
}

function entranceDelay(orbit: number, indexInOrbit: number): number {
  if (orbit === 0) return 0.3;
  if (orbit === 1) return 0.8 + indexInOrbit * 0.12;
  if (orbit === 2) return 1.3 + indexInOrbit * 0.06;
  return 1.8 + indexInOrbit * 0.05;
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
  const viewportWidth = useViewportWidth();

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

  const members = preview?.members ?? fetchedMembers;

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

  const isMobile = viewportWidth < 768;
  const scale = isMobile ? 1 : Math.min(1, Math.max(0.58, (viewportWidth - 96) / 1180));

  const { stars, orbitRadii } = useMemo(() => calculatePositions(members, scale), [members, scale]);
  const connections = useMemo(() => getConnectionLines(stars), [stars]);

  const containerSize = useMemo(() => {
    const maxR = orbitRadii[3] || 500;
    return maxR * 2 + 160;
  }, [orbitRadii]);

  const bgStars = useMemo(
    () =>
      Array.from({ length: 35 }).map((_, i) => ({
        id: i,
        left: ((i * 37) % 100),
        top: ((i * 53) % 100),
        delay: (i % 5) * 0.7,
        duration: 3 + (i % 4),
        size: 1 + (i % 3) * 0.6,
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

  const spotlight = (
    <SpotlightPanel
      member={selected}
      settings={{
        show_impact: settings.show_impact,
        show_quotes: settings.show_quotes,
        show_expertise: settings.show_expertise,
        show_links: settings.show_links,
      }}
      variant={isMobile ? 'sheet' : 'modal'}
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
      />
    );
  }

  const center = containerSize / 2;

  return (
    <section
      ref={sectionRef}
      id="webinar-people"
      className="relative py-20 md:py-28 border-t border-white/[0.04] overflow-x-hidden"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-[#050505]" aria-hidden />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: 'radial-gradient(ellipse at center, rgba(200,162,76,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {bgStars.map((s) => (
          <div
            key={s.id}
            className="galaxy-bg-star"
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
      </div>

      <div className="relative z-10 text-center mb-8 md:mb-12 px-4">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-[11px] uppercase tracking-[0.28em] text-[#C5A059]/90 mb-3"
          dir="ltr"
        >
          {settings.title_en}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-4xl font-heading text-white"
        >
          {settings.title_he}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base text-white/70 mt-3 font-light"
        >
          {settings.subtitle_he}
        </motion.p>
      </div>

      <div className="relative z-10 flex justify-center px-4 overflow-x-hidden">
        <div className="relative mx-auto" style={{ width: containerSize, height: containerSize, maxWidth: '100%' }}>
          {orbitRadii.slice(1).map((r, i) => (
            <motion.div
              key={`orbit-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="galaxy-orbit-ring"
              style={{ width: r * 2, height: r * 2 }}
            />
          ))}

          {inView && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${containerSize} ${containerSize}`}
              aria-hidden
            >
              {connections.map((conn, i) => (
                <motion.line
                  key={i}
                  x1={center + conn.from.x}
                  y1={center + conn.from.y}
                  x2={center + conn.to.x}
                  y2={center + conn.to.y}
                  stroke="rgba(200,162,76,0.12)"
                  strokeWidth="0.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.5 }}
                />
              ))}
            </svg>
          )}

          {inView &&
            stars.map((star) => (
              <Fragment key={star.member.id}>
                <StarNode
                  star={star}
                  onClick={select}
                  delay={starDelays.get(star.member.id) || 0}
                  selected={selected?.id === star.member.id}
                />
              </Fragment>
            ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 2.2 }}
            className="absolute bottom-2 left-2 flex flex-col gap-1.5 text-[10px] text-white/40"
            dir="ltr"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#F4D03F] text-base leading-none">☀</span>
              <span>Founder</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#D4AF37] text-sm leading-none">✦</span>
              <span>Leadership</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#C5A059] text-xs leading-none">✦</span>
              <span>Core Team</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#B8976A] text-[10px] leading-none">●</span>
              <span>Contributors</span>
            </div>
          </motion.div>
        </div>
      </div>

      {spotlight}
    </section>
  );
}

function TeamGalaxyMobile({
  members,
  settings,
  onSelect,
  sectionRef,
  spotlight,
}: {
  members: TeamMember[];
  settings: TeamSectionSettings;
  onSelect: (m: TeamMember) => void;
  sectionRef: RefObject<HTMLElement | null>;
  spotlight: ReactNode;
}) {
  const founder = members.find((m) => m.hierarchy_level === 'founder' || m.group_key === 'founder');
  const leadership = members.filter((m) => m.hierarchy_level === 'leadership' || m.group_key === 'leadership');
  const rest = members.filter((m) => m !== founder && !leadership.includes(m));

  return (
    <section
      ref={sectionRef}
      id="webinar-people"
      className="relative py-16 border-t border-white/[0.04] overflow-x-hidden"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-[#050505]" aria-hidden />

      <div className="relative z-10 text-center mb-10 px-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#C5A059]/90 mb-2" dir="ltr">
          {settings.title_en}
        </p>
        <h2 className="text-[28px] font-heading text-white">{settings.title_he}</h2>
        <p className="text-base text-white/70 font-light mt-2">{settings.subtitle_he}</p>
      </div>

      {founder && (
        <div className="relative z-10 flex justify-center mb-10">
          <MobileStar member={founder} size={96} onClick={() => onSelect(founder)} />
        </div>
      )}

      {leadership.length > 0 && (
        <div className="relative z-10 flex justify-center gap-6 mb-10 px-4 flex-wrap">
          {leadership.map((m) => (
            <div key={m.id}>
              <MobileStar member={m} onClick={() => onSelect(m)} />
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="relative z-10">
          <p className="text-center text-base text-white/45 mb-4">{settings.mobile_hint}</p>
          <div
            className="flex gap-5 overflow-x-auto px-4 pb-6 galaxy-mobile-scroller"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {rest.map((m) => (
              <div key={m.id} className="galaxy-mobile-card shrink-0">
                <MobileStar member={m} onClick={() => onSelect(m)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {spotlight}
    </section>
  );
}

function MobileStar({
  member,
  onClick,
  size,
}: {
  member: TeamMember;
  onClick: () => void;
  size?: number;
}) {
  const d = size ?? Math.min(starDiameter(member.impact_score, member.hierarchy_level), 72);
  const color = goldColor(member.hierarchy_level);
  const name = localizedName(member, 'he') || member.name;
  const role = localizedRole(member, 'en') || member.role;

  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center cursor-pointer min-h-11 min-w-11">
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: d,
          height: d,
          border: `2px solid ${color}`,
          boxShadow: `0 0 ${d * 0.2}px rgba(200,162,76,0.2)`,
        }}
      >
        <GalaxyPortrait src={member.photo || undefined} name={name} alt={member.photo_alt || name} className="w-full h-full" />
      </div>
      <p className="text-white text-[16px] font-medium mt-1.5 text-center max-w-[96px] leading-snug">{name}</p>
      <p className="text-sm text-center max-w-[96px] leading-snug" style={{ color }} dir="ltr">
        {role}
      </p>
    </button>
  );
}
