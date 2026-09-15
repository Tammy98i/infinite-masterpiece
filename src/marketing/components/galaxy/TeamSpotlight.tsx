import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { TeamMember } from '../../../lib/teamMembers';
import { StarPortrait } from './StarPortrait';

export function TeamSpotlight({ member, onClose, onStep }: {
  member: TeamMember; onClose: () => void; onStep: (step: number) => void;
}) {
  const founder = member.hierarchy_level === 'founder';
  return <aside id="team-spotlight" className={`galaxy-spotlight ${founder ? 'is-founder' : ''}`} aria-label={`פרופיל ${member.name}`}>
    <button type="button" className="galaxy-close" onClick={onClose} aria-label="סגירת פרופיל"><X size={18} /></button>
    <div className="galaxy-profile-header">
      <StarPortrait member={member} />
      <p className="galaxy-eyebrow">{founder ? 'FOUNDER & VISIONARY' : 'THE PEOPLE / THE IMPACT'}</p>
      <h3 dir="auto">{member.name}</h3>
      <p className="galaxy-profile-role" dir="auto">{member.role}</p>
    </div>
    <div className="galaxy-profile-copy" dir="rtl">
      {founder && <div><h4>VISION <span>החזון</span></h4><p dir="auto">{member.vision || 'החזון יתווסף בקרוב.'}</p></div>}
      <div><h4>ABOUT <span>מי אני</span></h4><p dir="auto">{member.bio || 'הפרטים יתווספו בקרוב.'}</p></div>
      <div><h4>CONTRIBUTION <span>התרומה שלי למיזם</span></h4><p dir="auto">{member.contribution || 'הפרטים יתווספו בקרוב.'}</p></div>
      <div><h4>KEY RESPONSIBILITIES <span>תחומי אחריות</span></h4>
        {member.responsibilities.length ? <ul>{member.responsibilities.map((item, i) => <li key={i} dir="auto">{item}</li>)}</ul> : <p>הפרטים יתווספו בקרוב.</p>}
      </div>
      <div><h4>EXPERTISE <span>תחומי מומחיות</span></h4><div className="galaxy-tags">{member.expertise.map((item, i) => <span key={i}>{item}</span>)}{!member.expertise.length && <p>הפרטים יתווספו בקרוב.</p>}</div></div>
    </div>
    <div className="galaxy-impact" dir="ltr"><div><span>IMPACT SCORE</span><span>{member.impact_score} / 100</span></div>
      <meter min={0} max={100} value={member.impact_score} aria-label="רמת השפעה" />
    </div>
    <nav className="galaxy-profile-nav" aria-label="מעבר בין חברי הצוות" dir="ltr">
      <button type="button" onClick={() => onStep(-1)} aria-label="איש הצוות הקודם"><ChevronLeft size={18} /></button>
      <span>ONE SYSTEM. INFINITE IMPACT.</span>
      <button type="button" onClick={() => onStep(1)} aria-label="איש הצוות הבא"><ChevronRight size={18} /></button>
    </nav>
  </aside>;
}
