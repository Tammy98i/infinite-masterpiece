import { motion } from 'motion/react';
import { GalaxyPortrait } from './GalaxyPortrait';
import type { PositionedStar } from './galaxyUtils';
import { goldColor, frameWidth, glowSize } from './galaxyUtils';
import { localizedName, localizedRole } from '../../../constants/teamGalaxySeed';
import type { TeamMember } from '../../../api/teamMembers';

interface StarNodeProps {
  star: PositionedStar;
  onClick: (member: TeamMember) => void;
  delay: number;
  selected?: boolean;
}

export function StarNode({ star, onClick, delay, selected }: StarNodeProps) {
  const { member, diameter, isFounder } = star;
  const color = goldColor(member.hierarchy_level);
  const frame = frameWidth(member.hierarchy_level);
  const glow = glowSize(member.impact_score, isFounder);
  const name = localizedName(member, 'he') || member.name;
  const role = localizedRole(member, 'en') || member.role;
  const isLeadership = member.hierarchy_level === 'leadership' || member.group_key === 'leadership';

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="absolute flex flex-col items-center cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70 rounded-full"
      style={{
        left: `calc(50% + ${star.x}px)`,
        top: `calc(50% + ${star.y}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: isFounder ? 20 : selected ? 16 : isLeadership ? 14 : 10,
      }}
      onClick={() => onClick(member)}
      whileHover={{ scale: 1.08 }}
      aria-pressed={Boolean(selected)}
      aria-label={`${name}, ${role}`}
    >
      <div
        className="galaxy-star-glow"
        style={{
          width: diameter + glow * 2,
          height: diameter + glow * 2,
          opacity: isFounder ? 0.7 : selected ? 0.55 : 0.4,
        }}
      />

      {isFounder && (
        <div className="galaxy-founder-glow" style={{ width: diameter * 2.05, height: diameter * 2.05 }} />
      )}

      <div
        className="relative rounded-full overflow-hidden transition-shadow duration-300 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
        style={{
          width: diameter,
          height: diameter,
          border: `${frame + (selected ? 0.6 : 0)}px solid ${color}`,
          boxShadow: selected
            ? `0 0 ${glow}px rgba(244, 208, 63, 0.55)`
            : `0 0 ${glow}px rgba(212, 175, 55, ${isFounder ? 0.6 : 0.25})`,
        }}
      >
        <GalaxyPortrait src={member.photo || undefined} name={name} alt={member.photo_alt || name} className="w-full h-full" />
      </div>

      <div className="mt-2 text-center pointer-events-none">
        <p
          className="text-white font-medium leading-tight whitespace-nowrap"
          style={{ fontSize: isFounder ? 13 : isLeadership ? 12 : 11 }}
        >
          {name}
        </p>
        <p className="leading-tight whitespace-nowrap" style={{ fontSize: isFounder ? 11 : 9, color }} dir="ltr">
          {role}
        </p>
      </div>
    </motion.button>
  );
}
