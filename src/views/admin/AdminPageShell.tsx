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
    <div className="grid gap-3" lang="he">
      <header className="crm-desk-page-header sticky top-[4.5rem] z-10 -mx-1 px-1 py-1.5 bg-[#050505]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              <span>ניהול</span>
              <span className="crm-desk-crumb-sep" aria-hidden>
                /
              </span>
              <span>{group}</span>
            </p>
            <h1 className="text-lg font-medium text-white leading-tight">{title}</h1>
            {description ? <p className="text-xs text-white/40 font-light truncate max-w-2xl">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-1.5 shrink-0">{actions}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}
