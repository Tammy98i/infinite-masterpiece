type Props = {
  className?: string;
};

/** Fixed night-sky plate. Pair with `.sky-readable` on the content shell. */
export function SkyBackdrop({ className = '' }: Props) {
  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <img
        src="https://media.base44.com/images/public/6aa94dfb715e7d446231f544/ce298813f_image.png"
        alt=""
        width={1024}
        height={768}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[#010308]/55" />
    </div>
  );
}
