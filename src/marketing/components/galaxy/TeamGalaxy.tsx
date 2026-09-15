import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Infinity as InfinityIcon, Pause, Play, Sparkles, Sun } from 'lucide-react';
import { teamMembersApi } from '../../../api/teamMembers';
import { sortTeam, starDiameter, starPosition, type TeamMember } from '../../../lib/teamMembers';
import { StarPortrait } from './StarPortrait';
import { TeamSpotlight } from './TeamSpotlight';
import './TeamGalaxy.css';

export function TeamGalaxy() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [page, setPage] = useState(0);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<number | null>(null);
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
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)');
    const change = () => { setCompact(query.matches); setPage(0); };
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  const founder = members.find(member => member.hierarchy_level === 'founder');
  const satellites = members.filter(member => member.hierarchy_level !== 'founder');
  const capacity = compact ? 2 : 6;
  const pageCount = Math.max(1, Math.ceil(satellites.length / capacity));
  const safePage = Math.min(page, pageCount - 1);
  const visible = satellites.slice(safePage * capacity, (safePage + 1) * capacity);
  const profile = members.find(member => member.id === selected);
  const close = () => { setPinned(false); setSelected(null); lastTrigger.current?.focus({ preventScroll: true }); };
  const step = (direction: number) => {
    if (!members.length) return;
    const index = members.findIndex(member => member.id === selected);
    const next = members[(index + direction + members.length) % members.length];
    setPinned(true);
    setSelected(next.id);
    const satelliteIndex = satellites.findIndex(member => member.id === next.id);
    if (satelliteIndex >= 0) setPage(Math.floor(satelliteIndex / capacity));
  };
  const renderStar = (member: TeamMember, slot: number) => {
    const sun = member.hierarchy_level === 'founder';
    const position = starPosition(member, slot);
    return <motion.div key={member.id} className={`galaxy-star-anchor ${sun ? 'galaxy-sun' : ''}`}
      style={{ left: `${position.x}%`, top: `${position.y}%`, '--star-size': `${starDiameter(member)}px`, '--star-glow': `${10 + member.impact_score * 0.28}px` } as CSSProperties}
      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 1.2, delay: sun ? 0 : 0.65 + slot * 0.15 }}>
      <button type="button" className="galaxy-star" data-member-id={member.id} data-impact={member.impact_score}
        aria-label={`הצגת פרופיל ${member.name}`} aria-expanded={selected === member.id} aria-controls="team-spotlight"
        onPointerEnter={event => { if (event.pointerType === 'mouse' && !pinned) setSelected(member.id); }}
        onClick={event => { lastTrigger.current = event.currentTarget; setPinned(true); setSelected(member.id); }}>
        <span className="galaxy-stellar-body"><StarPortrait member={member} /><span className="galaxy-flare" aria-hidden="true">✦</span></span>
        <span className="galaxy-star-name" dir="auto">{member.name}</span>
        <span className="galaxy-star-role" dir="auto">{sun ? 'FOUNDER / VISIONARY' : member.role}</span>
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
          <div className="galaxy-map" onTouchStart={event => { touchStart.current = event.touches[0].clientX; }}
            onTouchEnd={event => {
              const start = touchStart.current; touchStart.current = null;
              if (start !== null && Math.abs(event.changedTouches[0].clientX - start) > 55) {
                setPage(current => (current + (event.changedTouches[0].clientX < start ? 1 : -1) + pageCount) % pageCount);
              }
            }}>
            <div className="galaxy-orbits" aria-hidden="true">
              {[0, 1, 2, 3].map((ring) => <motion.div key={ring} className={`galaxy-orbit galaxy-orbit-${ring}`} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.25 + ring * 0.12, duration: 1.5 }}><span /></motion.div>)}
            </div>
            {founder && renderStar(founder, 0)}
            {visible.map(renderStar)}
            <div className="galaxy-manifesto" aria-hidden="true"><InfinityIcon size={30} strokeWidth={1} /><span>A MORE CREATIVE WORLD<br />IS POSSIBLE.</span></div>
          </div>
          <div className="galaxy-map-footer">
            <div className="galaxy-legend" aria-label="מקרא גודל הכוכבים">
              <div><span><Sun size={18} />Founder</span><span><Sparkles size={15} />Leadership</span><span><span className="galaxy-legend-core">✦</span>Core Team</span><span><span className="galaxy-legend-dot">•</span>Contributors</span></div>
              <p>Star Size = Impact Level</p>
            </div>
            <button type="button" className="galaxy-motion-toggle" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'הפעלת תנועת הכוכבים' : 'השהיית תנועת הכוכבים'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
          </div>
          {pageCount > 1 && <nav className="galaxy-paging" aria-label="מסלולי צוות">
            <button type="button" aria-label="מסלול קודם" onClick={() => setPage((safePage - 1 + pageCount) % pageCount)}><ChevronLeft size={18} /></button>
            <span role="status">{safePage + 1} / {pageCount} · {compact ? 'החליקו או הקישו להמשך הצוות' : 'לגלות עוד אנשים במערכת'}</span>
            <button type="button" aria-label="מסלול הבא" onClick={() => setPage((safePage + 1) % pageCount)}><ChevronRight size={18} /></button>
          </nav>}
        </div>
        <div className="galaxy-panel-slot">
          {profile ? <TeamSpotlight member={profile} onClose={close} onStep={step} /> : <div className="galaxy-idle"><Sun size={36} strokeWidth={0.8} /><p className="galaxy-eyebrow">EVERY PERSON. A FORCE.</p><h3>האנשים שמאחורי החזון</h3><p>בחרו כוכב וגלו את האדם,<br />את הכוח ואת התרומה למערכת.</p><span>INFINITE PEOPLE.<br />INFINITE POSSIBILITIES.</span></div>}
        </div>
      </div>
      <p className="galaxy-bottom-note">מערכת אחת. כוחות שונים. השפעה אינסופית.</p>
    </>}
  </motion.section>;
}
