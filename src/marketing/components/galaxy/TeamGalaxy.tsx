import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Infinity as InfinityIcon, Pause, Play, Sparkles, Sun } from 'lucide-react';
import { teamMembersApi } from '../../../api/teamMembers';
import { sortTeam, starDiameter, starPosition, type TeamMember } from '../../../lib/teamMembers';
import { InlineStarDetails } from './InlineStarDetails';
import { StarPortrait } from './StarPortrait';
import './TeamGalaxy.css';

export function TeamGalaxy() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => teamMembersApi.list().then(res => {
      if (!cancelled) { setMembers(sortTeam(res.members)); setError(''); setReady(true); }
    }).catch(() => { if (!cancelled) { setError('לא ניתן לטעון את הצוות כרגע.'); setReady(true); } });
    void load();
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    window.addEventListener('team-members-updated', refresh);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('team-members-updated', refresh); };
  }, []);
  const founder = members.find(member => member.hierarchy_level === 'founder');
  const leaders = members.filter(member => member.hierarchy_level === 'leadership');
  const contributors = members.filter(member => member.hierarchy_level !== 'founder' && member.hierarchy_level !== 'leadership');
  const satellites = [...leaders, ...contributors];
  const profile = members.find(member => member.id === selected);
  const close = (restoreFocus = true) => {
    setSelected(null);
    if (restoreFocus) lastTrigger.current?.focus({ preventScroll: true });
  };
  const renderStar = (member: TeamMember, slot: number) => {
    const sun = member.hierarchy_level === 'founder';
    const featured = sun || member.hierarchy_level === 'leadership';
    const isSelected = selected === member.id;
    const naturalPosition = starPosition(
      member,
      member.hierarchy_level === 'leadership' ? leaders.findIndex(item => item.id === member.id) : contributors.findIndex(item => item.id === member.id),
      member.hierarchy_level === 'leadership' ? leaders.length : contributors.length
    );
    const position = isSelected
      ? { x: 50, y: 38 }
      : profile && sun
        ? { x: 16, y: 50 }
        : naturalPosition;
    const diameter = starDiameter(member);
    return <motion.div key={member.id}
      className={`galaxy-star-anchor ${sun ? 'galaxy-sun' : ''} ${featured ? 'galaxy-featured' : ''} ${isSelected ? 'is-selected' : ''}`}
      style={{ left: `${position.x}%`, top: `${position.y}%`, '--star-size': `${diameter}px`, '--star-glow': `${10 + member.impact_score * 0.28}px` } as CSSProperties}
      initial={{ opacity: 0 }} animate={{ left: `${position.x}%`, top: `${position.y}%`, opacity: profile && !isSelected ? 0.32 : 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: isSelected ? 0 : sun ? 0 : Math.min(slot * 0.04, 0.28) }}>
      <button type="button" className="galaxy-star" data-member-id={member.id} data-impact={member.impact_score}
        aria-label={isSelected ? `סגירת פרטי ${member.name}` : `הצגת פרטי ${member.name}`} aria-expanded={isSelected}
        aria-controls={isSelected ? `team-inline-details-${member.id}` : undefined}
        onClick={event => {
          lastTrigger.current = event.currentTarget;
          setSelected(current => current === member.id ? null : member.id);
        }}>
        <span className="galaxy-stellar-body"><StarPortrait member={member} /><span className="galaxy-flare" aria-hidden="true">✦</span></span>
        <span className="galaxy-star-name" dir="auto">{member.name}</span>
        {isSelected
          ? <InlineStarDetails member={member} />
          : <span className="galaxy-star-role" dir="auto">{sun ? 'FOUNDER / VISIONARY' : member.role}</span>}
      </button>
    </motion.div>;
  };
  return <motion.section id="team-universe" className={`team-galaxy ${paused ? 'galaxy-paused' : ''}`}
    aria-labelledby="galaxy-title" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 1 }}
    onKeyDown={event => { if (event.key === 'Escape' && profile) { event.preventDefault(); close(); } }}>
    <div className="galaxy-dust" aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 13) % 100}%`, top: `${(i * 23 + 7) % 100}%`, animationDelay: `${i * -0.7}s` }} />)}</div>
    <header className="galaxy-heading">
      <p className="galaxy-eyebrow" dir="ltr">THE PEOPLE BEHIND INFINITE MASTERPIECE</p>
      <h2 id="galaxy-title" dir="ltr">THE PEOPLE BEHIND <em>THE VISION</em></h2>
      <p dir="ltr">Different strengths. One system. Infinite impact.</p>
      <span>כל אחד מביא כוח אחר. יחד הם יוצרים מערכת אחת.</span>
    </header>
    {!ready ? <p role="status" className="galaxy-message">טוענים את מערכת הכוכבים…</p> : !members.length ? <p className="galaxy-message" role="status">{error || 'הצוות יוצג כאן בקרוב.'}</p> : <>
      {error && <p className="galaxy-message" role="status">{error}</p>}
      <div className="galaxy-layout" dir="ltr">
        <div className="galaxy-map-wrap">
          <div className={`galaxy-map ${profile ? 'has-selection' : ''}`}
            onClick={event => {
              if (event.target instanceof Element && !event.target.closest('.galaxy-star') && profile) close(false);
            }}>
            <div className="galaxy-orbits" aria-hidden="true">
              {[0, 1, 2, 3].map((ring) => <motion.div key={ring} className={`galaxy-orbit galaxy-orbit-${ring}`} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.25 + ring * 0.12, duration: 1.5 }}><span /></motion.div>)}
            </div>
            {founder && renderStar(founder, 0)}
            {satellites.map(renderStar)}
            <div className="galaxy-manifesto" aria-hidden="true"><InfinityIcon size={30} strokeWidth={1} /><span>A MORE CREATIVE WORLD<br />IS POSSIBLE.</span></div>
          </div>
          <div className="galaxy-map-footer">
            <div className="galaxy-legend" aria-label="מקרא גודל הכוכבים">
              <div><span><Sun size={18} />Founder</span><span><Sparkles size={15} />Leadership</span><span><span className="galaxy-legend-core">✦</span>Core Team</span><span><span className="galaxy-legend-dot">•</span>Contributors</span></div>
              <p>Star Size = Impact Level</p>
            </div>
            <button type="button" className="galaxy-motion-toggle" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'הפעלת תנועת הכוכבים' : 'השהיית תנועת הכוכבים'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
          </div>
        </div>

      </div>
      <p className="galaxy-bottom-note">מערכת אחת. כוחות שונים. השפעה אינסופית.</p>
    </>}
  </motion.section>;
}
