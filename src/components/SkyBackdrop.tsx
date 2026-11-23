const SITE_SKY = 'https://media.base44.com/images/public/6aa94dfb715e7d446231f544/025d40d79_image.png';
const LIBRARY_CLOUDS = '/library/clouds.png';

type Props = {
  className?: string;
  library?: boolean;
};

/** Fixed night-sky plate. Pair with `.sky-readable` on the content shell. */
export function SkyBackdrop({ className = '', library = false }: Props) {
  return (
    <div className={`editorial-sky-backdrop fixed inset-0 z-0 pointer-events-none overflow-hidden ${library ? 'is-library-sky' : ''} ${className}`} aria-hidden="true">
      <img
        src={SITE_SKY}
        alt=""
        width={1023}
        height={438}
        className={`editorial-sky-image is-site absolute inset-0 h-full w-full object-cover object-center${library ? ' is-inactive' : ''}`}
      />
      <img
        src={LIBRARY_CLOUDS}
        alt=""
        width={1672}
        height={941}
        className={`editorial-sky-image is-library absolute inset-0 h-full w-full object-cover object-bottom${library ? '' : ' is-inactive'}`}
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
