import { motion } from 'motion/react';
import { TeamPhoto } from '../../../components/TeamPhoto';
import type { PositionedStar } from './galaxyUtils';
import { goldColor, frameWidth, glowSize } from './galaxyUtils';
import type { TeamMember } from '../../../api/teamMembers';

interface StarNodeProps {
  star: PositionedStar;
  onClick: (member: TeamMember) => void;
  delay: number;
}

export function StarNode({ star, onClick, delay }: StarNodeProps) {
  const { member, diameter, isFounder } = star;
  const color = goldColor(member.hierarchy_level);
  const frame = frameWidth(member.hierarchy_level);
  const glow = glowSize(member.impact_score, isFounder);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="absolute flex flex-col items-center cursor-pointer group"
      style={{
        left: `calc(50% + ${star.x}px)`,
        top: `calc(50% + ${star.y}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: isFounder ? 20 : 10,
      }}
      onClick={() => onClick(member)}
      whileHover={{ scale: 1.12 }}
      aria-label={`${member.name}, ${member.role}`}
    >
      {/* Glow */}
      <div
        className="galaxy-star-glow"
        style={{
          width: diameter + glow * 2,
          height: diameter + glow * 2,
          opacity: isFounder ? 0.7 : 0.4,
        }}
      />

      {/* Founder rays */}
      {isFounder && (
        <div
          className="galaxy-sun-rays"
          style={{ width: diameter * 2.2, height: diameter * 2.2 }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={i}
                x1="50" y1="50"
                x2={50 + Math.cos((i / 12) * Math.PI * 2) * 48}
                y2={50 + Math.sin((i / 12) * Math.PI * 2) * 48}
                stroke="rgba(244, 208, 63, 0.15)"
                strokeWidth="0.3"
              />
            ))}
          </svg>
        </div>
      )}

      {/* Star photo with golden frame */}
      <div
        className="relative rounded-full overflow-hidden transition-shadow duration-300 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
        style={{
          width: diameter,
          height: diameter,
          border: `${frame}px solid ${color}`,
          boxShadow: `0 0 ${glow}px rgba(212, 175, 55, ${isFounder ? 0.6 : 0.25})`,
        }}
      >
        <TeamPhoto
          src={member.photo || undefined}
          name={member.name}
          alt={member.name}
          className="w-full h-full"
        />
      </div>

      {/* Label */}
      <div className="mt-2 text-center pointer-events-none">
        <p
          className="text-white font-medium leading-tight whitespace-nowrap"
          style={{ fontSize: isFounder ? 13 : 11 }}
        >
          {member.name}
        </p>
        <p
          className="leading-tight whitespace-nowrap"
          style={{ fontSize: isFounder ? 11 : 9, color }}
        >
          {member.role}
        </p>
      </div>
    </motion.button>
  );
}
