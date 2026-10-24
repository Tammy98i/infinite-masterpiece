import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Infinity as InfinityIcon, Pause, Play } from 'lucide-react';
import { teamMembersApi } from '../../../api/teamMembers';
import { sortTeam, starDiameter, starPosition, type TeamMember } from '../../../lib/teamMembers';
import { InlineStarDetails } from './InlineStarDetails';
import { StarPortrait } from './StarPortrait';
import './TeamGalaxy.css';

export function TeamGalaxy({
  className = '',
  eyebrow = 'האנשים מאחורי החזון',
  title = 'הצוות שמחזיק את המערכת',
  subtitle = 'כל אחד מביא כוח אחר. יחד הם יוצרים מערכת אחת.',
  mobileCarousel = false,
}: {
  className?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  mobileCarousel?: boolean;
}) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mobileMode, setMobileMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobileMode(mobileCarousel && query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [mobileCarousel]);
  useEffect(() => {
    if (mobileCarousel && members.length && !paused) {
      setActiveId(current => members.some(member => member.id === current) ? current : members[0].id);
    }
  }, [mobileCarousel, members, paused]);
  useEffect(() => {
    if (!mobileCarousel || paused || members.length < 2) return;
    const timer = window.setInterval(() => {
      const map = mapRef.current;
      if (!map || window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.classList.contains('a11y-reduce-motion') ||
        document.hidden || map.querySelector(':focus-visible')) return;
      const bounds = map.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      const ids = Array.from<HTMLButtonElement>(map.querySelectorAll('.galaxy-star')).map(button => button.dataset.memberId!);
      setActiveId(current => ids[(ids.indexOf(current ?? '') + 1) % ids.length]);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [mobileCarousel, paused, members.length]);
  useEffect(() => {
    const map = mapRef.current;
    if (!mobileMode || !map || !activeId) return;
    const button = Array.from<HTMLButtonElement>(map.querySelectorAll('.galaxy-star')).find(item => item.dataset.memberId === activeId);
    const card = button?.parentElement;
    if (!card) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion');
    map.scrollTo({ left: card.offsetLeft - (map.clientWidth - card.offsetWidth) / 2, behavior: reduced ? 'instant' : 'smooth' });
  }, [mobileMode, activeId]);
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
  const profile = members.find(member => member.id === (mobileCarousel ? activeId : selected));
  const close = (restoreFocus = true) => {
    if (mobileCarousel) { setPaused(true); setActiveId(null); }
    else setSelected(null);
    if (restoreFocus) lastTrigger.current?.focus({ preventScroll: true });
  };
  const renderStar = (member: TeamMember, slot: number) => {
    const sun = member.hierarchy_level === 'founder';
    const featured = sun || member.hierarchy_level === 'leadership';
    const isSelected = profile?.id === member.id;
    const naturalPosition = starPosition(
      member,
      member.hierarchy_level === 'leadership' ? leaders.findIndex(item => item.id === member.id) : contributors.findIndex(item => item.id === member.id),
      member.hierarchy_level === 'leadership' ? leaders.length : contributors.length
    );
    const position = isSelected
      ? { x: 50, y: 30 }
      : profile && sun
        ? { x: 14, y: 52 }
        : naturalPosition;
    const diameter = starDiameter(member);
    return <motion.div key={member.id}
      className={`galaxy-star-anchor ${sun ? 'galaxy-sun' : ''} ${featured ? 'galaxy-featured' : ''} ${isSelected ? 'is-selected' : ''}`}
      style={{ left: `${position.x}%`, top: `${position.y}%`, '--star-x': `${position.x}%`, '--star-size': `${diameter}px`, '--satellite-size': `${starDiameter({ ...member, hierarchy_level: 'core' })}px`, '--portrait-boost': ['גלב סמירנוב', 'תמי אליאן'].includes(member.name.trim()) ? 1.15 : 1, '--star-glow': `${10 + member.impact_score * 0.28}px` } as CSSProperties}
      initial={{ opacity: 0 }} animate={{ left: `${position.x}%`, top: `${position.y}%`, opacity: profile && !isSelected ? 0.32 : 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: isSelected ? 0 : sun ? 0 : Math.min(slot * 0.04, 0.28) }}>
      <button type="button" className="galaxy-star" data-member-id={member.id} data-impact={member.impact_score}
        aria-label={isSelected && !mobileMode ? `סגירת פרטי ${member.name}` : `הצגת פרטי ${member.name}`} aria-expanded={isSelected}
        aria-controls={isSelected ? `team-inline-details-${member.id}` : undefined}
        onClick={event => {
          lastTrigger.current = event.currentTarget;
          if (mobileCarousel) {
            if (isSelected && !mobileMode) close(false);
            else setActiveId(member.id);
          } else setSelected(current => current === member.id ? null : member.id);
        }}>
        <span className="galaxy-stellar-body"><StarPortrait member={member} /></span>
        <span className="galaxy-star-name" dir="auto">{member.name}</span>
        {isSelected
          ? <InlineStarDetails member={member} />
          : sun ? <span className="galaxy-star-role" dir="auto">FOUNDER / VISIONARY</span> : null}
      </button>
    </motion.div>;
  };
  return <motion.section id="team-universe" className={`team-galaxy ${mobileCarousel ? 'galaxy-mobile-carousel' : ''} ${paused ? 'galaxy-paused' : ''} ${className}`.trim()}
    aria-labelledby="galaxy-title" initial={mobileCarousel ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 1 }}
    onKeyDown={event => { if (event.key === 'Escape' && profile) { event.preventDefault(); close(); } }}>
    <div className="galaxy-dust" aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 13) % 100}%`, top: `${(i * 23 + 7) % 100}%`, animationDelay: `${i * -0.7}s` }} />)}</div>
    <header className="galaxy-heading">
      <p className="galaxy-eyebrow">{eyebrow}</p>
      <h2 id="galaxy-title">{title}</h2>
      <p>{subtitle}</p>
    </header>
    {!ready ? <p role="status" className="galaxy-message">טוענים את מערכת הכוכבים…</p> : !members.length ? <p className="galaxy-message" role="status">{error || 'הצוות יוצג כאן בקרוב.'}</p> : <>
      {error && <p className="galaxy-message" role="status">{error}</p>}
      <div className="galaxy-layout" dir="ltr">
        <div className="galaxy-map-wrap">
          <div ref={mapRef} className={`galaxy-map ${profile ? 'has-selection' : ''}`}
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
            <button type="button" className="galaxy-motion-toggle" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'הפעלת תנועת הכוכבים' : 'השהיית תנועת הכוכבים'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
          </div>
        </div>

      </div>
      <p className="galaxy-bottom-note">מערכת אחת. כוחות שונים. השפעה אינסופית.</p>
    </>}
  </motion.section>;
}
