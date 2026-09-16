import { useEffect, useState } from 'react';

type Props = {
  src?: string;
  name: string;
  alt?: string;
  className?: string;
};

function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.slice(0, 2);
  return (name.trim().charAt(0) || '✦').toUpperCase();
}

export function GalaxyPortrait({ src, name, alt, className }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`galaxy-portrait-placeholder relative flex items-center justify-center overflow-hidden ${className ?? ''}`}
        role={alt ? 'img' : undefined}
        aria-label={alt}
        aria-hidden={!alt}
      >
        <span className="galaxy-portrait-star" aria-hidden>
          ✦
        </span>
        <span className="relative font-heading text-[#E8D9B0] text-[0.32em] tracking-[0.12em]">{monogram(name)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? name}
      className={`object-cover object-top bg-[#0c0a08] ${className ?? ''}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
