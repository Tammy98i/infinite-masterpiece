import { motion } from 'motion/react';
import { GalaxyPortrait } from './GalaxyPortrait';
import type { PositionedStar } from './galaxyUtils';
import { goldColor, frameWidth, glowSize } from './galaxyUtils';
import type { TeamMember } from '../../../api/teamMembers';

interface StarNodeProps {
  star: PositionedStar;
  x: number;
  y: number;
  onClick: (member: TeamMember) => void;
  delay: number;
  selected: boolean;
}

export function StarNode({ star, x, y, onClick, delay, selected }: StarNodeProps) {
  const { member, diameter, isFounder } = star;
  const color = goldColor(member.hierarchy_level);
  const frame = frameWidth(member.hierarchy_level);
  const glow = glowSize(member.impact_score, isFounder);
  const isLeadership = member.hierarchy_level === 'leadership';
  const isOuter = member.orbit >= 3;
  const showRole = member.role.trim() && member.role.trim().toLowerCase() !== member.name.trim().toLowerCase();
  const nameSize = isFounder ? 13 : isLeadership ? 12 : isOuter ? 10 : 11;
  const roleSize = isFounder ? 10 : isLeadership ? 10 : 9;

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: isFounder ? 24 : selected ? 16 : isLeadership ? 14 : 10,
      }}
    >
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.28 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70"
        onClick={() => onClick(member)}
        whileHover={{ scale: 1.05 }}
        aria-pressed={selected}
        aria-label={`${member.name}, ${member.role}`}
      >
        <div
          className="galaxy-star-glow"
          style={{
            width: diameter + glow * 2,
            height: diameter + glow * 2,
            opacity: isFounder ? 0.85 : selected ? 0.55 : 0.32,
          }}
        />

        {isFounder && (
          <div className="galaxy-founder-glow" style={{ width: diameter * 2.05, height: diameter * 2.05 }} />
        )}

        <div
          className="relative rounded-full overflow-hidden"
          style={{
            width: diameter,
            height: diameter,
            border: `${frame + (selected ? 0.6 : 0)}px solid ${color}`,
            boxShadow: selected
              ? `0 0 ${glow}px rgba(244, 208, 63, 0.55)`
              : `0 0 ${glow}px rgba(212, 175, 55, ${isFounder ? 0.62 : 0.22})`,
          }}
        >
          <GalaxyPortrait
            src={member.photo || undefined}
            name={member.name}
            alt={member.name}
            className="w-full h-full"
          />
        </div>

        <div className="mt-2 text-center pointer-events-none">
          <p className="text-white font-medium leading-tight galaxy-star-label" style={{ fontSize: nameSize }}>
            {member.name}
          </p>
          {showRole && (
            <p
              className="leading-tight mt-0.5 galaxy-star-label"
              style={{ fontSize: roleSize, color, letterSpacing: isFounder ? '0.18em' : '0.04em' }}
            >
              {isFounder ? member.role.toUpperCase() : member.role}
            </p>
          )}
        </div>
      </motion.button>
    </div>
  );
}
