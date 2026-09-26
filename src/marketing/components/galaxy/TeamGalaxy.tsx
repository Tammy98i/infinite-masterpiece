import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Infinity as InfinityIcon, Pause, Play } from 'lucide-react';
import { teamMembersApi } from '../../../api/teamMembers';
import { sortTeam, starDiameter, starPosition, type TeamMember } from '../../../lib/teamMembers';
import { InlineStarDetails } from './InlineStarDetails';
import { StarPortrait } from './StarPortrait';
import './TeamGalaxy.css';

const COMPACT_MQ = '(max-width: 1199px)';

function memberSummary(member: TeamMember) {
  return member.bio || member.contribution || 'פרטים נוספים יתווספו בקרוב.';
}

export function TeamGalaxy({
  className = '',
  eyebrow = 'האנשים מאחורי החזון',
  title = 'הצוות שמחזיק את המערכת',
  subtitle = 'כל אחד מביא כוח אחר. יחד הם יוצרים מערכת אחת.',
}: {
  className?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(COMPACT_MQ).matches : false
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

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
    const mq = window.matchMedia(COMPACT_MQ);
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const founder = members.find(member => member.hierarchy_level === 'founder');
  const leaders = members.filter(member => member.hierarchy_level === 'leadership');
  const contributors = members.filter(member => member.hierarchy_level !== 'founder' && member.hierarchy_level !== 'leadership');
  const satellites = [...leaders, ...contributors];
  const profile = members.find(member => member.id === selected);

  const featuredMember =
    (featuredId ? members.find(member => member.id === featuredId) : null) || founder || null;
  const orbitalRail = members.filter(member => member.id !== featuredMember?.id);
  const showFeaturedBio = Boolean(featuredId && featuredMember);

  const close = (restoreFocus = true) => {
    setSelected(null);
    if (restoreFocus) lastTrigger.current?.focus({ preventScroll: true });
  };

  const resetOrbital = () => setFeaturedId(null);

  useEffect(() => {
    if (!compact || !featuredId) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.galaxy-orbit-sat') || target.closest('.galaxy-motion-toggle')) return;
      resetOrbital();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [compact, featuredId]);

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
      ? { x: 50, y: 30 }
      : profile && sun
        ? { x: 14, y: 52 }
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
          : sun ? <span className="galaxy-star-role" dir="auto">FOUNDER / VISIONARY</span> : null}
      </button>
    </motion.div>;
  };

  const renderOrbital = () => {
    if (!featuredMember) return null;
    const isFounderFeatured = featuredMember.hierarchy_level === 'founder' && !featuredId;
    return (
      <div className="galaxy-orbital" dir="rtl">
        <div
          className={`galaxy-orbital-featured ${featuredMember.hierarchy_level === 'founder' ? 'is-founder' : ''}`}
          aria-live="polite"
        >
          <div className="galaxy-orbital-sun">
            <span className="galaxy-flare" aria-hidden="true">✦</span>
            <StarPortrait member={featuredMember} />
          </div>
          <p className="galaxy-orbital-name" dir="auto">{featuredMember.name}</p>
          <p className="galaxy-orbital-role" dir="auto">
            {featuredMember.hierarchy_level === 'founder'
              ? (featuredMember.role || 'FOUNDER / VISIONARY')
              : featuredMember.role}
          </p>
          {showFeaturedBio ? (
            <p className="galaxy-orbital-bio" dir="auto">{memberSummary(featuredMember)}</p>
          ) : null}
          {isFounderFeatured ? (
            <p className="galaxy-orbital-hint">בחרו כוכב במסלול כדי להכיר את הצוות</p>
          ) : null}
        </div>

        <p className="galaxy-orbital-label">מסלול הצוות</p>
        <div className="galaxy-orbital-track">
          <div className="galaxy-orbital-ring galaxy-orbital-ring-a" aria-hidden="true" />
          <div className="galaxy-orbital-ring galaxy-orbital-ring-b" aria-hidden="true" />
          <div className="galaxy-orbit-rail" role="list" aria-label="חברי הצוות במסלול">
            {orbitalRail.map((member) => (
              <button
                key={member.id}
                type="button"
                role="listitem"
                className="galaxy-orbit-sat"
                data-member-id={member.id}
                aria-pressed={featuredId === member.id}
                aria-label={`הצגת ${member.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  lastTrigger.current = event.currentTarget;
                  setFeaturedId(member.id);
                }}
              >
                <span className="galaxy-orbit-sat-orb">
                  <StarPortrait member={member} />
                </span>
                <span className="galaxy-orbit-sat-name" dir="auto">{member.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="galaxy-map-footer galaxy-orbital-footer">
          <button
            type="button"
            className="galaxy-motion-toggle"
            onClick={() => setPaused(value => !value)}
            aria-pressed={paused}
            aria-label={paused ? 'הפעלת תנועת הכוכבים' : 'השהיית תנועת הכוכבים'}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
      </div>
    );
  };

  return <motion.section
    ref={sectionRef}
    id="team-universe"
    className={`team-galaxy ${paused ? 'galaxy-paused' : ''} ${compact ? 'is-orbital' : ''} ${className}`.trim()}
    aria-labelledby="galaxy-title"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 1 }}
    onKeyDown={event => {
      if (event.key !== 'Escape') return;
      if (compact && featuredId) {
        event.preventDefault();
        resetOrbital();
        return;
      }
      if (profile) {
        event.preventDefault();
        close();
      }
    }}
  >
    <div className="galaxy-dust" aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 13) % 100}%`, top: `${(i * 23 + 7) % 100}%`, animationDelay: `${i * -0.7}s` }} />)}</div>
    <header className="galaxy-heading">
      <p className="galaxy-eyebrow">{eyebrow}</p>
      <h2 id="galaxy-title">{title}</h2>
      <p>{subtitle}</p>
    </header>
    {!ready ? <p role="status" className="galaxy-message">טוענים את מערכת הכוכבים…</p> : !members.length ? <p className="galaxy-message" role="status">{error || 'הצוות יוצג כאן בקרוב.'}</p> : <>
      {error && <p className="galaxy-message" role="status">{error}</p>}
      {compact ? renderOrbital() : (
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
              <button type="button" className="galaxy-motion-toggle" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'הפעלת תנועת הכוכבים' : 'השהיית תנועת הכוכבים'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
            </div>
          </div>
        </div>
      )}
      <p className="galaxy-bottom-note">מערכת אחת. כוחות שונים. השפעה אינסופית.</p>
    </>}
  </motion.section>;
}
