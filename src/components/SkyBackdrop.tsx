type Props = {
  className?: string;
};

/** Fixed night-sky plate. Pair with `.sky-readable` on the content shell. */
export function SkyBackdrop({ className = '' }: Props) {
  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <img
        src="https://media.base44.com/images/public/6aa94dfb715e7d446231f544/68f8c5a13_image.png"
        alt=""
        width={1024}
        height={768}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1.5px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#010308]/42 via-transparent to-[#010308]/62" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(1,3,8,0.45)_100%)]" />
    </div>
  );
}
