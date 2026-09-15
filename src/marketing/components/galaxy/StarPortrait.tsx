import { useState } from 'react';
import type { TeamMember } from '../../../lib/teamMembers';

export function StarPortrait({ member }: { member: TeamMember }) {
  const [failedPhoto, setFailedPhoto] = useState('');
  return <span className="galaxy-portrait">
    {member.photo && member.photo !== failedPhoto ? (
      <img src={member.photo} alt="" onError={() => setFailedPhoto(member.photo)} />
    ) : (
      <span className="galaxy-monogram" aria-hidden="true">{member.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('')}</span>
    )}
  </span>;
}
