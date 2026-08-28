type Props = {
  className?: string;
};

/** Fixed night-sky plate. Pair with `.sky-readable` on the content shell. */
export function SkyBackdrop({ className = '' }: Props) {
  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <img
        src="/webinar-background.jpg"
        alt=""
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[#010308]/58" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#010308]/55 via-transparent to-[#010308]/72" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(1,3,8,0.45)_100%)]" />
    </div>
  );
}
