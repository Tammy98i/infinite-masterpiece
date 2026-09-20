type Props = {
  className?: string;
};

/** Fixed night-sky plate. Pair with `.sky-readable` on the content shell. */
export function SkyBackdrop({ className = '' }: Props) {
  return (
    <div className={`editorial-sky-backdrop fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <img
        src="https://media.base44.com/images/public/6aa94dfb715e7d446231f544/025d40d79_image.png"
        alt=""
        width={1023}
        height={438}
        className="editorial-sky-image absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="editorial-sky-blackout absolute inset-0" />
      <div className="editorial-sky-shade absolute inset-0" />
    </div>
  );
}
