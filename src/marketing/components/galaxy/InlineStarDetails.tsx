import { Link } from 'react-router-dom';
import type { TeamMember } from '../../../lib/teamMembers';

function profilePath(member: TeamMember) {
  const name = member.name.replace(/[׳'\"״`´]/g, '');
  if (name.includes('גלב')) return '/premium-88/gleb';
  if (name.includes('תמי אליאן')) return '/premium-88/tami';
  if (name.includes('גל אברמוביץ')) return '/premium-88/gal';
  return `/premium-88/${encodeURIComponent(member.id)}`;
}

export function InlineStarDetails({ member }: { member: TeamMember }) {
  const summary = member.bio || member.contribution || 'פרטים נוספים יתווספו בקרוב.';

  return (
    <span id={`team-inline-details-${member.id}`} className="galaxy-inline-details" dir="rtl">
      <span className="galaxy-inline-role" dir="auto">{member.role}</span>
      <span className="galaxy-inline-bio" dir="auto">{summary}</span>
      <Link to={profilePath(member)} className="galaxy-more">עוד</Link>
    </span>
  );
}
