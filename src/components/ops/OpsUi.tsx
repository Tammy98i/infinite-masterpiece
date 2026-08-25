import type { ReactNode } from 'react';

export const opsFieldClass =
  'w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:border-[#C8A24C] focus:outline-none min-h-11';

export const opsLabelClass = 'block text-base text-white/70 mb-1.5';

export const opsPrimaryBtn =
  'inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#C8A24C] text-black text-base font-medium min-h-12 cursor-pointer hover:bg-[#F7E7B5] disabled:opacity-60';

export const opsGhostBtn =
  'inline-flex items-center justify-center px-5 py-3 rounded-full border border-white/15 text-base text-white min-h-12 hover:border-white/40';

export function OpsPageHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-light">{title}</h2>
      {hint ? <p className="text-base text-white/60 mt-2 font-light max-w-2xl">{hint}</p> : null}
    </div>
  );
}

export function OpsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 pt-2">
      <h3 className="text-lg font-light text-white">{title}</h3>
      {children}
    </section>
  );
}

export function OpsField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={opsLabelClass}>{label}</span>
      {children}
    </label>
  );
}
