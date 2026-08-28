type Props = {
  className?: string;
  alt?: string;
};

/** Gold infinity mark. Height is set by className; width follows the original ratio. */
export function SiteLogo({ className = 'h-8', alt = 'Infinite Masterpiece' }: Props) {
  return (
    <img
      src="/logo-infinity.png"
      alt={alt}
      width={1589}
      height={584}
      className={`w-auto max-w-none shrink-0 ${className}`}
      decoding="async"
    />
  );
}
