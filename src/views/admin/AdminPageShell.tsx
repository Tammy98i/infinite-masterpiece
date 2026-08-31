import type { ReactNode } from 'react';

type AdminPageShellProps = {
  group: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({ group, title, description, actions, children }: AdminPageShellProps) {
  return (
    <div className="grid gap-6">
      <header className="sticky top-[4.5rem] z-10 -mx-1 px-1 py-3 bg-[#050505]/95 backdrop-blur-md border-b border-white/5 mb-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8A24C]/90 mb-1">
              ניהול <span className="text-white/25 mx-1.5">›</span> {group}
            </p>
            <h1 className="text-2xl font-light text-white">{title}</h1>
            {description ? <p className="text-sm text-white/50 font-light mt-1.5 max-w-2xl">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}
