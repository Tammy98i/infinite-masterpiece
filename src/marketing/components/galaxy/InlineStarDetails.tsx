import type { TeamMember } from '../../../lib/teamMembers';

export function InlineStarDetails({ member }: { member: TeamMember }) {
  const summary = member.bio || member.contribution || 'פרטים נוספים יתווספו בקרוב.';

  return (
    <span id={`team-inline-details-${member.id}`} className="galaxy-inline-details" dir="rtl">
      <span className="galaxy-inline-role" dir="auto">{member.role}</span>
      <span className="galaxy-inline-bio" dir="auto">{summary}</span>
    </span>
  );
}
