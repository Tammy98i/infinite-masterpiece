import { useState, type ReactElement } from 'react';

type Props = {
  src?: string;
  name: string;
  alt?: string;
  className?: string;
};

export function TeamPhoto({ src, name, alt, className }: Props): ReactElement {
  const [failed, setFailed] = useState(!src);
  const initial = name.trim().charAt(0) || '·';

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(200,162,76,0.28),#0b1020_70%)] text-[#F7E7B5] font-heading ${className ?? ''}`}
        aria-hidden={!alt}
        role={alt ? 'img' : undefined}
        aria-label={alt}
      >
        <span className="text-[0.7em] font-semibold">{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? name}
      className={`object-cover object-top bg-[#0b1020] ${className ?? ''}`}
      onError={() => setFailed(true)}
    />
  );
}
