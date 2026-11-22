import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { featuredFounders, instructorToFounder, rosterFounders, type Founder } from '../data/founders';
import { CATEGORIES } from '../../data/categories';
import { catalogApi } from '../../api/catalog';
import { teamMembersApi } from '../../api/teamMembers';

function personKey(value: string) {
  return value.trim().replace(/[׳'\"״`´]/g, '').replace(/\s+/g, ' ').toLowerCase();
}

function samePerson(a: string, b: string) {
  const left = personKey(a).split(' ').filter(Boolean);
  const right = personKey(b).split(' ').filter(Boolean);
  if (left.join(' ') === right.join(' ')) return true;
  const fold = (token: string) => token.replace(/י/g, '');
  if (left.map(fold).join(' ') === right.map(fold).join(' ')) return true;
  const lastLeft = fold(left[left.length - 1] || '');
  const lastRight = fold(right[right.length - 1] || '');
  return Boolean(
    left[0] && left[0] === right[0]
    && lastLeft.length >= 4
    && lastRight.length >= 4
    && (lastLeft.startsWith(lastRight) || lastRight.startsWith(lastLeft))
  );
}

function FounderCell({
  founder,
  size,
  lectureCount,
  photoUrl,
}: {
  founder: Founder;
  size: 'featured' | 'roster';
  lectureCount: number;
  photoUrl?: string;
}): ReactElement {
  const photo =
    size === 'featured'
      ? 'w-28 h-28 md:w-32 md:h-32'
      : 'w-20 h-20 md:w-24 md:h-24';

  return (
    <div className="text-center">
      <Link
        to={`/premium-88/${founder.id}`}
        className="group block w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79043] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0b08] rounded-lg"
      >
        <img
          src={photoUrl || founder.image}
          alt={founder.name}
          className={`${photo} rounded-full object-cover mx-auto mb-4`}
        />
        <h2 className="text-base md:text-lg font-medium text-white mb-1">{founder.name}</h2>
        {founder.role ? (
          <p className="text-[#dfc47d] text-xs md:text-sm tracking-[0.22em] font-semibold mb-1">
            {founder.role}
          </p>
        ) : null}
        <p className="text-[#b79043] text-[11px] md:text-xs tracking-widest mb-2 font-medium">
          {founder.title}
        </p>
        <p className="text-sm text-white/45 font-light leading-relaxed line-clamp-1">
          {founder.blurb}
        </p>
        {founder.leadCategoryIds.length > 0 && (
          <p className="text-[11px] text-white/30 mt-2 leading-relaxed">
            {founder.leadCategoryIds
              .map((id) => CATEGORIES.find((c) => c.id === id)?.name)
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </Link>
      <div className="mt-4 flex flex-col items-center gap-1">
        <Link
          to={`/premium-88/${founder.id}`}
          className="text-xs text-white/40 hover:text-white min-h-11 inline-flex items-center cursor-pointer"
        >
          קרא עוד
        </Link>
        {lectureCount > 0 && (
          <Link
            to={`/premium-88/${founder.id}#lectures`}
            className="text-xs text-[#b79043] hover:text-[#dfc47d] min-h-11 inline-flex items-center cursor-pointer"
          >
            צפייה בהרצאות
          </Link>
        )}
      </div>
    </div>
  );
}

export function FounderRoster() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<Founder[]>([]);
  const [extras, setExtras] = useState<Founder[]>([]);
  const [suppressed, setSuppressed] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .get()
      .then(({ courses, instructors }) => {
        if (cancelled) return;
        const next: Record<string, number> = {};
        const nextPhotos: Record<string, string> = {};
        const known = new Set(featuredFounders.concat(rosterFounders).map((item) => item.id));
        const extraFounders: Founder[] = [];
        for (const inst of instructors) {
          if (!inst.isFounder) continue;
          const key = inst.founderId || inst.id;
          next[key] = courses.filter((c) => c.instructorId === inst.id).length;
          if (inst.avatarUrl) nextPhotos[key] = inst.avatarUrl;
          if (!known.has(key)) extraFounders.push(instructorToFounder(inst));
        }
        setCounts(next);
        setPhotos(nextPhotos);
        setExtras(extraFounders);
      })
      .catch(() => undefined);
    teamMembersApi
      .list('site')
      .then(({ members, suppressedNames }) => {
        if (cancelled) return;
        setSuppressed(suppressedNames || []);
        const known = featuredFounders.concat(rosterFounders);
        setCopied(
          members
            .filter((member) => !known.some((founder) => samePerson(founder.name, member.name)))
            .map((member) => ({
              id: member.id,
              name: member.name,
              title: member.role,
              blurb: member.bio.split(/\n\n+/)[0] || member.role,
              description: member.bio,
              image: member.photo,
              expertise: member.expertise,
              leadCategoryIds: [],
              portfolio: [],
            }))
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const hidden = (name: string) => suppressed.some((item) => samePerson(item, name));
  const leaders = featuredFounders.filter((founder) => !hidden(founder.name));
  const seen = leaders.map((founder) => founder.name);
  const teammates = [...rosterFounders, ...copied, ...extras].filter((founder) => {
    if (hidden(founder.name) || seen.some((name) => samePerson(name, founder.name))) return false;
    seen.push(founder.name);
    return true;
  });
  const team = [...leaders, ...teammates];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
      {team.map((founder) => (
        <Fragment key={founder.id}>
          <FounderCell
            founder={founder}
            size="featured"
            lectureCount={counts[founder.id] || 0}
            photoUrl={photos[founder.id]}
          />
        </Fragment>
      ))}
    </div>
  );
}
