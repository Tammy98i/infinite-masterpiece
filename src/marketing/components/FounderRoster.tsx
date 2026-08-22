import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { featuredFounders, instructorToFounder, rosterFounders, type Founder } from '../data/founders';
import { CATEGORIES } from '../../data/categories';
import { catalogApi } from '../../api/catalog';

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
        className="group block w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A24C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#010308] rounded-lg"
      >
        <img
          src={photoUrl || founder.image}
          alt={founder.name}
          className={`${photo} rounded-full object-cover grayscale mx-auto mb-4 transition-opacity duration-200 group-hover:opacity-90`}
        />
        <h2 className="text-base md:text-lg font-medium text-white mb-1">{founder.name}</h2>
        <p className="text-[#C8A24C] text-[11px] md:text-xs tracking-widest mb-2 font-medium">
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
            className="text-xs text-[#C8A24C] hover:text-[#F7E7B5] min-h-11 inline-flex items-center cursor-pointer"
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
  const [sortOrder, setSortOrder] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Founder[]>([]);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .get()
      .then(({ courses, instructors }) => {
        if (cancelled) return;
        const next: Record<string, number> = {};
        const order: Record<string, number> = {};
        const nextPhotos: Record<string, string> = {};
        const known = new Set(featuredFounders.concat(rosterFounders).map((item) => item.id));
        const extraFounders: Founder[] = [];
        for (const inst of instructors) {
          if (!inst.isFounder) continue;
          const key = inst.founderId || inst.id;
          next[key] = courses.filter((c) => c.instructorId === inst.id).length;
          order[key] = inst.sortOrder ?? 0;
          if (inst.avatarUrl) nextPhotos[key] = inst.avatarUrl;
          if (!known.has(key)) extraFounders.push(instructorToFounder(inst));
        }
        setCounts(next);
        setSortOrder(order);
        setPhotos(nextPhotos);
        setExtras(extraFounders);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const byOrder = (list: Founder[]) =>
    [...list].sort((a, b) => (sortOrder[a.id] ?? 99) - (sortOrder[b.id] ?? 99));

  return (
    <>
      {featuredFounders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 md:gap-16 mb-20 md:mb-28">
          {byOrder(featuredFounders).map((founder) => (
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
      )}

      {(rosterFounders.length > 0 || extras.length > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-10 md:gap-y-16">
          {byOrder([...rosterFounders, ...extras]).map((founder) => (
            <Fragment key={founder.id}>
              <FounderCell
                founder={founder}
                size="roster"
                lectureCount={counts[founder.id] || 0}
                photoUrl={photos[founder.id]}
              />
            </Fragment>
          ))}
        </div>
      )}
    </>
  );
}
