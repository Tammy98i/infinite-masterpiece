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
      <div className="editorial-sky-library-veil editorial-sky-library-veil-a absolute inset-0" />
      <div className="editorial-sky-library-veil editorial-sky-library-veil-b absolute inset-0" />
      <div className="editorial-sky-library-veil editorial-sky-library-veil-c absolute inset-0" />
      <div className="editorial-sky-library-veil editorial-sky-library-veil-d absolute inset-0" />
      <div className="editorial-sky-library-veil editorial-sky-library-veil-e absolute inset-0" />
      <div className="editorial-sky-library-veil editorial-sky-library-veil-f absolute inset-0" />
      <div className="editorial-sky-library-veil editorial-sky-library-veil-g absolute inset-0" />
      <div className="editorial-sky-library-veil editorial-sky-library-veil-h absolute inset-0" />
      <div className="editorial-sky-crm-veil editorial-sky-crm-veil-a absolute inset-0" />
      <div className="editorial-sky-crm-veil editorial-sky-crm-veil-b absolute inset-0" />
      <div className="editorial-sky-crm-veil editorial-sky-crm-veil-c absolute inset-0" />
      <div className="editorial-sky-crm-veil editorial-sky-crm-veil-d absolute inset-0" />
      <div className="editorial-sky-crm-veil editorial-sky-crm-veil-e absolute inset-0" />
      <div className="editorial-sky-crm-veil editorial-sky-crm-veil-f absolute inset-0" />
      <div className="editorial-sky-crm-veil editorial-sky-crm-veil-g absolute inset-0" />
      <div className="editorial-sky-crm-veil editorial-sky-crm-veil-h absolute inset-0" />
    </div>
  );
}
