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
  return (name.trim().charAt(0) || '·').toUpperCase();
}

export function GalaxyPortrait({ src, name, alt, className }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden ${className ?? ''}`}
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(212,175,55,0.1) 0%, #080705 70%)',
        }}
        role={alt ? 'img' : undefined}
        aria-label={alt}
        aria-hidden={!alt}
      >
        <span className="font-heading text-[#E8D9B0]/70 text-[0.34em] tracking-[0.08em]">{monogram(name)}</span>
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
