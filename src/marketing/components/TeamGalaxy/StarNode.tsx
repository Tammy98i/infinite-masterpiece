import { motion } from 'motion/react';
import { GalaxyPortrait } from './GalaxyPortrait';
import type { PositionedStar } from './galaxyUtils';
import { goldColor, frameWidth, glowSize, isCtoOrCco, isLeadership } from './galaxyUtils';
import { localizedName, localizedRole } from '../../../constants/teamGalaxySeed';
import type { TeamMember } from '../../../api/teamMembers';

interface StarNodeProps {
  star: PositionedStar;
  onClick: (member: TeamMember) => void;
  delay: number;
  selected?: boolean;
  dimmed?: boolean;
  reducedMotion?: boolean;
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

  return (
    <motion.button
      type="button"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.72 }}
      animate={{ opacity: dimmed ? 0.38 : 1, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.85, delay: reducedMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
      className="absolute flex flex-col items-center cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70 rounded-full galaxy-star-idle"
      style={{
        left: `calc(50% + ${star.x}px)`,
        top: `calc(50% + ${star.y}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: isFounder ? 24 : selected ? 20 : innerLead ? 16 : leadership ? 13 : 10,
        animationDelay: `${(member.display_order ?? 0) * 0.35}s`,
      }}
      onClick={() => onClick(member)}
      aria-pressed={Boolean(selected)}
      aria-label={`${name}, ${role}`}
    >
      <motion.span
        className="relative flex items-center justify-center"
        style={{ width: diameter, height: diameter }}
        whileHover={reducedMotion ? undefined : { scale: 1.06 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {isFounder ? (
          <>
            <span className="galaxy-founder-corona" style={{ width: diameter * 2.55, height: diameter * 2.55 }} />
            <span className="galaxy-founder-glow" style={{ width: diameter * 2.1, height: diameter * 2.1 }} />
            <span className="galaxy-founder-rays" aria-hidden />
          </>
        ) : (
          <>
            <span
              className="galaxy-star-glow"
              style={{
                width: diameter + glow * 2,
                height: diameter + glow * 2,
                opacity: selected ? 0.7 : innerLead ? 0.55 : 0.32,
              }}
            />
            {innerLead ? <span className="galaxy-starburst" aria-hidden /> : null}
          </>
        )}

        <span
          className="relative rounded-full overflow-hidden"
          style={{
            width: diameter,
            height: diameter,
            border: `${frame + (selected ? 0.5 : 0)}px solid ${color}`,
            boxShadow: selected
              ? `0 0 ${glow}px rgba(244, 208, 63, 0.55)`
              : `0 0 ${glow}px rgba(212, 175, 55, ${isFounder ? 0.55 : innerLead ? 0.4 : 0.18})`,
          }}
        >
          <GalaxyPortrait src={member.photo || undefined} name={name} alt={member.photo_alt || name} className="w-full h-full" />
        </span>
      </motion.span>

      <span className="mt-2 text-center pointer-events-none block">
        <span
          className="block font-medium leading-tight whitespace-nowrap text-[#F7F1E4]"
          style={{ fontSize: isFounder ? 15 : innerLead ? 12.5 : leadership ? 11.5 : 10.5 }}
        >
          {name}
        </span>
        <span
          className="block leading-tight whitespace-nowrap"
          style={{ fontSize: isFounder ? 11 : 9, color, letterSpacing: isFounder ? '0.14em' : '0.04em' }}
          dir="ltr"
        >
          {isFounder ? 'FOUNDER & VISIONARY' : role}
        </span>
      </span>
    </motion.button>
  );
}
