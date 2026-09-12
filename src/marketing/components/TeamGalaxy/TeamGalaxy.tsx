import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { teamMembersApi, type TeamMember } from '../../../api/teamMembers';
import { TeamPhoto } from '../../../components/TeamPhoto';
import { StarNode } from './StarNode';
import { SpotlightPanel } from './SpotlightPanel';
import {
  calculatePositions,
  getConnectionLines,
  starDiameter,
  goldColor,
} from './galaxyUtils';
import './galaxy.css';

const HEADER_TITLE = 'THE PEOPLE BEHIND THE VISION';
const HEADER_SUB = 'Different strengths. One system. Infinite impact.';
const HEADER_HE = 'האנשים שמאחורי החזון';
const HEADER_SUB_HE = 'כל אחד מביא כוח אחר. יחד הם יוצרים מערכת אחת.';

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
  if (orbit === 1) return 0.8 + indexInOrbit * 0.15;
  if (orbit === 2) return 1.3 + indexInOrbit * 0.1;
  return 1.8 + indexInOrbit * 0.08;
}

export function TeamGalaxy() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const viewportWidth = useViewportWidth();

  useEffect(() => {
    teamMembersApi.list().then(setMembers).catch(() => {});
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1100;
  const maxOrbit = isMobile ? 3 : isTablet ? 2 : 3;
  const scale = isTablet ? 0.78 : 1;

  const visibleMembers = useMemo(
    () => members.filter((m) => m.orbit <= maxOrbit),
    [members, maxOrbit],
  );

  const { stars, orbitRadii } = useMemo(
    () => calculatePositions(visibleMembers, scale),
    [visibleMembers, scale],
  );

  const connections = useMemo(() => getConnectionLines(stars), [stars]);

  const containerSize = useMemo(() => {
    const maxR = orbitRadii.filter((_, i) => i <= maxOrbit).pop() || 400;
    return maxR * 2 + 140;
  }, [orbitRadii, maxOrbit]);

  const bgStars = useMemo(
    () =>
      Array.from({ length: 35 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 4,
        size: 1 + Math.random() * 2,
      })),
    [],
  );

  // Group stars by orbit for delay calculation
  const orbitCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const s of stars) {
      const o = s.member.orbit;
      counts.set(o, (counts.get(o) || 0) + 1);
    }
    return counts;
  }, [stars]);

  const starDelays = useMemo(() => {
    const counters = new Map<number, number>();
    const delays = new Map<string, number>();
    for (const s of stars) {
      const o = s.member.orbit;
      const idx = counters.get(o) || 0;
      counters.set(o, idx + 1);
      delays.set(s.member.id, entranceDelay(o, idx));
    }
    return delays;
  }, [stars, orbitCounts]);

  if (isMobile) {
    return (
      <TeamGalaxyMobile
        members={members}
        onSelect={setSelected}
        selected={selected}
        onClose={() => setSelected(null)}
        sectionRef={sectionRef}
        inView={inView}
      />
    );
  }

  const center = containerSize / 2;

  return (
    <section
      ref={sectionRef}
      id="webinar-people"
      className="relative py-20 md:py-28 border-t border-white/[0.04] overflow-hidden"
    >
      {/* Deep space background */}
      <div className="absolute inset-0 bg-[#050505]" aria-hidden />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(200,162,76,0.04) 0%, transparent 60%)',
        }}
      />

      {/* Background stars */}
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

      {/* Header */}
      <div className="relative z-10 text-center mb-8 md:mb-12 px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-4xl font-heading text-white tracking-[0.15em] uppercase"
        >
          {HEADER_TITLE}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm text-[#C5A059] mt-3 font-light"
        >
          {HEADER_SUB}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-2"
        >
          <p className="text-base md:text-lg text-white/70 font-light">{HEADER_HE}</p>
          <p className="text-sm text-white/40 font-light">{HEADER_SUB_HE}</p>
        </motion.div>
      </div>

      {/* Galaxy */}
      <div className="relative z-10 flex justify-center px-4">
        <div
          className="relative"
          style={{ width: containerSize, height: containerSize, maxWidth: '100%' }}
        >
          {/* Orbit rings */}
          {orbitRadii.slice(1, maxOrbit + 1).map((r, i) => (
            <motion.div
              key={`orbit-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="galaxy-orbit-ring"
              style={{ width: r * 2, height: r * 2 }}
            />
          ))}

          {/* Connection lines */}
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

          {/* Stars */}
          {inView &&
            stars.map((star) => (
              <StarNode
                key={star.member.id}
                star={star}
                onClick={setSelected}
                delay={starDelays.get(star.member.id) || 0}
              />
            ))}

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 2.2 }}
            className="absolute bottom-2 left-2 flex flex-col gap-1.5 text-[10px] text-white/40"
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
            <p className="mt-1 text-[9px] text-white/30 italic">Star Size = Impact Level</p>
          </motion.div>
        </div>
      </div>

      {/* Spotlight */}
      <SpotlightPanel member={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

/* ─── Mobile Layout ─── */

function TeamGalaxyMobile({
  members,
  onSelect,
  selected,
  onClose,
  sectionRef,
}: {
  members: TeamMember[];
  onSelect: (m: TeamMember) => void;
  selected: TeamMember | null;
  onClose: () => void;
  sectionRef: React.RefObject<HTMLElement | null>;
  inView: boolean;
}) {
  const founder = members.find((m) => m.hierarchy_level === 'founder');
  const leadership = members.filter((m) => m.hierarchy_level === 'leadership');
  const rest = members.filter((m) => m.hierarchy_level !== 'founder' && m.hierarchy_level !== 'leadership');

  return (
    <section
      ref={sectionRef}
      id="webinar-people"
      className="relative py-16 border-t border-white/[0.04] overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#050505]" aria-hidden />

      {/* Header */}
      <div className="relative z-10 text-center mb-10 px-4">
        <h2 className="text-lg font-heading text-white tracking-[0.1em] uppercase">{HEADER_TITLE}</h2>
        <p className="text-xs text-[#C5A059] mt-2 font-light">{HEADER_SUB}</p>
        <p className="text-sm text-white/70 font-light mt-2">{HEADER_HE}</p>
      </div>

      {/* Founder */}
      {founder && (
        <div className="relative z-10 flex justify-center mb-10">
          <button
            type="button"
            onClick={() => onSelect(founder)}
            className="flex flex-col items-center cursor-pointer"
          >
            <div
              className="relative rounded-full overflow-hidden"
              style={{
                width: 96,
                height: 96,
                border: '3px solid #F4D03F',
                boxShadow: '0 0 30px rgba(244, 208, 63, 0.4)',
              }}
            >
              <TeamPhoto src={founder.photo || undefined} name={founder.name} alt={founder.name} className="w-full h-full" />
            </div>
            <p className="text-white text-sm font-medium mt-3">{founder.name}</p>
            <p className="text-[#F4D03F] text-xs mt-0.5">{founder.role}</p>
          </button>
        </div>
      )}

      {/* Leadership row */}
      {leadership.length > 0 && (
        <div className="relative z-10 flex justify-center gap-6 mb-10 px-4">
          {leadership.map((m) => (
            <MobileStar key={m.id} member={m} onClick={() => onSelect(m)} />
          ))}
        </div>
      )}

      {/* Rest — swipeable list */}
      {rest.length > 0 && (
        <div className="relative z-10">
          <p className="text-center text-[11px] text-white/30 mb-4">החליקו כדי לראות עוד ↤</p>
          <div
            className="flex gap-5 overflow-x-auto px-4 pb-6"
            style={{ scrollbarWidth: 'thin', scrollSnapType: 'x mandatory' }}
          >
            {rest.map((m) => (
              <div key={m.id} className="galaxy-mobile-card shrink-0">
                <MobileStar member={m} onClick={() => onSelect(m)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <SpotlightPanel member={selected} onClose={onClose} />
    </section>
  );
}

function MobileStar({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  const d = starDiameter(member.impact_score, member.hierarchy_level === 'founder');
  const size = Math.min(d, 72);
  const color = goldColor(member.hierarchy_level);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer"
    >
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          border: `2px solid ${color}`,
          boxShadow: `0 0 ${size * 0.2}px rgba(200,162,76,0.2)`,
        }}
      >
        <TeamPhoto src={member.photo || undefined} name={member.name} alt={member.name} className="w-full h-full" />
      </div>
      <p className="text-white text-[11px] font-medium mt-1.5 text-center max-w-[80px]">{member.name}</p>
      <p className="text-[10px] text-center max-w-[80px]" style={{ color }}>{member.role}</p>
    </button>
  );
}
