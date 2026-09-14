import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { GalaxyPortrait } from './GalaxyPortrait';
import type { PositionedStar } from './galaxyUtils';
import { goldColor, frameWidth, glowSize, isCtoOrCco, isLeadership } from './galaxyUtils';
import { localizedName, localizedRole } from '../../../constants/teamGalaxySeed';
import type { TeamMember } from '../../../api/teamMembers';

interface StarNodeProps {
  star: PositionedStar;
  onClick: (member: TeamMember, trigger: HTMLButtonElement) => void;
  delay: number;
  selected?: boolean;
  dimmed?: boolean;
  reducedMotion?: boolean;
}

function labelPlacement(): CSSProperties {
  return { top: '100%', left: '50%', transform: 'translate(-50%, 8px)', textAlign: 'center' };
}

export function StarNode({ star, onClick, delay, selected, dimmed, reducedMotion }: StarNodeProps) {
  const { member, diameter, isFounder } = star;
  const color = goldColor(member.hierarchy_level);
  const frame = frameWidth(member.hierarchy_level, member);
  const glow = glowSize(member.impact_score, isFounder, member);
  const name = localizedName(member, 'he') || member.name;
  const role = localizedRole(member, 'en') || member.role;
  const leadership = isLeadership(member);
  const innerLead = isCtoOrCco(member);
  const labelStyle = labelPlacement();

  return (
    <div
      className="absolute"
      style={{
        left: `calc(50% + ${star.x}px)`,
        top: `calc(50% + ${star.y}px)`,
        width: diameter,
        height: diameter,
        transform: 'translate(-50%, -50%)',
        zIndex: isFounder ? 24 : selected ? 20 : innerLead ? 16 : leadership ? 13 : 10,
      }}
    >
    <motion.button
      type="button"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: dimmed ? 0.7 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : delay }}
      className="relative w-full h-full cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70 rounded-full after:absolute after:inset-[-12px] after:content-[''] after:rounded-full"
      onClick={(e) => {
        e.stopPropagation();
        onClick(member, e.currentTarget);
      }}
      aria-pressed={Boolean(selected)}
      aria-label={`${name}, ${role}`}
    >
      <motion.span
        className="relative flex items-center justify-center w-full h-full"
        whileHover={reducedMotion ? undefined : { scale: 1.05 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {isFounder ? (
          <>
            <span className="galaxy-founder-corona" style={{ width: diameter * 2.2, height: diameter * 2.2 }} />
            <span className="galaxy-founder-glow" style={{ width: diameter * 1.85, height: diameter * 1.85 }} />
          </>
        ) : (
          <span
            className="galaxy-star-glow"
            style={{
              width: diameter + glow * 1.4,
              height: diameter + glow * 1.4,
              opacity: selected ? 0.55 : innerLead ? 0.4 : 0.22,
            }}
          />
        )}

        <span
          className="relative rounded-full overflow-hidden"
          style={{
            width: diameter,
            height: diameter,
            border: `${frame + (selected ? 0.5 : 0)}px solid ${color}`,
            boxShadow: `0 0 ${Math.max(8, glow * 0.45)}px rgba(212, 175, 55, ${isFounder ? 0.35 : innerLead ? 0.22 : 0.12})`,
          }}
        >
          <GalaxyPortrait src={member.photo || undefined} name={name} alt={member.photo_alt || name} className="w-full h-full" />
        </span>
      </motion.span>

      <span className="absolute pointer-events-none max-w-[140px]" style={labelStyle}>
        <span
          className="block font-medium leading-tight whitespace-nowrap text-[#F7F1E4]"
          style={{ fontSize: isFounder ? 16 : innerLead ? 13 : leadership ? 11.5 : 10.5 }}
        >
          {name}
        </span>
        <span
          className="block leading-tight whitespace-nowrap"
          style={{ fontSize: isFounder ? 11 : 9, color, letterSpacing: isFounder ? '0.12em' : '0.03em' }}
          dir="ltr"
        >
          {isFounder ? 'FOUNDER & VISIONARY' : role}
        </span>
      </span>
    </motion.button>
    </div>
  );
}
