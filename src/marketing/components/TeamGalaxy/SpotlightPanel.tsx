import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { TeamMember } from '../../../api/teamMembers';
import { TeamPhoto } from '../../../components/TeamPhoto';
import { goldColor, frameWidth } from './galaxyUtils';

interface SpotlightPanelProps {
  member: TeamMember | null;
  onClose: () => void;
}

const FOUNDER_QUOTE = "People don't build great things alone — but one person can ignite the system that makes them possible.";

export function SpotlightPanel({ member, onClose }: SpotlightPanelProps) {
  const isFounder = member?.hierarchy_level === 'founder';

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="galaxy-spotlight-backdrop flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${isFounder ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto rounded-2xl border border-[#D4AF37]/30 bg-[#080808]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-[#D4AF37]/50 transition-colors"
              aria-label="סגירה"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8 text-right" dir="rtl">
              {/* Header */}
              {isFounder && (
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#F4D03F] mb-4 text-center">
                  FOUNDER &amp; VISIONARY
                </p>
              )}

              {/* Photo */}
              <div className="flex justify-center mb-5">
                <div
                  className="relative rounded-full overflow-hidden"
                  style={{
                    width: isFounder ? 120 : 88,
                    height: isFounder ? 120 : 88,
                    border: `${frameWidth(member.hierarchy_level)}px solid ${goldColor(member.hierarchy_level)}`,
                    boxShadow: isFounder
                      ? '0 0 40px rgba(244, 208, 63, 0.4)'
                      : '0 0 20px rgba(200, 162, 76, 0.2)',
                  }}
                >
                  <TeamPhoto
                    src={member.photo || undefined}
                    name={member.name}
                    alt={member.name}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Name & Role */}
              <h3 className="text-xl text-white font-heading text-center mb-1">{member.name}</h3>
              <p className="text-sm text-[#C5A059] text-center mb-5">{member.role}</p>

              {/* Impact Gauge */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-white/40">Impact</span>
                  <span className="text-xs text-[#D4AF37] font-medium">{member.impact_score}/100</span>
                </div>
                <div className="galaxy-impact-bar">
                  <div
                    className="galaxy-impact-fill"
                    style={{ width: `${member.impact_score}%` }}
                  />
                </div>
              </div>

              {/* Sections */}
              {isFounder ? (
                <>
                  <SpotlightSection label="VISION" text={member.bio} />
                  <SpotlightSection label="CONTRIBUTION" text={member.contribution} />
                  <SpotlightList label="KEY RESPONSIBILITIES" items={member.responsibilities} />
                  {member.expertise.length > 0 && (
                    <SpotlightTags label="EXPERTISE" items={member.expertise} />
                  )}
                </>
              ) : (
                <>
                  <SpotlightSection label="מי אני" text={member.bio} />
                  <SpotlightSection label="התרומה שלי למיזם" text={member.contribution} />
                  <SpotlightList label="תחומי אחריות" items={member.responsibilities} />
                  {member.expertise.length > 0 && (
                    <SpotlightTags label="תחומי מומחיות" items={member.expertise} />
                  )}
                </>
              )}

              {/* Founder closing quote */}
              {isFounder && (
                <blockquote className="mt-6 pt-5 border-t border-[#D4AF37]/10 text-center">
                  <p className="text-sm text-white/50 font-light italic leading-relaxed">
                    {FOUNDER_QUOTE}
                  </p>
                </blockquote>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SpotlightSection({ label, text }: { label: string; text: string }) {
  if (!text?.trim()) return null;
  return (
    <div className="mb-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#C5A059] mb-2">{label}</p>
      <p className="text-sm text-white/70 font-light leading-relaxed">{text}</p>
    </div>
  );
}

function SpotlightList({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mb-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#C5A059] mb-2">{label}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-white/70 font-light flex items-start gap-2">
            <span className="text-[#D4AF37] mt-1 shrink-0">◦</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpotlightTags({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mb-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#C5A059] mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="px-3 py-1 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-xs text-white/60"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
