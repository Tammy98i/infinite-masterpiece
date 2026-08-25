import { useEffect, useRef, useState, type ReactNode } from 'react';

export const opsFieldClass =
  'w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:border-[#C8A24C] focus:outline-none min-h-11';

export const opsLabelClass = 'block text-sm text-white/55 mb-1';

export const opsPrimaryBtn =
  'inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#C8A24C] text-black text-base font-medium min-h-12 cursor-pointer hover:bg-[#F7E7B5] disabled:opacity-60';

export const opsGhostBtn =
  'inline-flex items-center justify-center px-5 py-3 rounded-full border border-white/15 text-base text-white min-h-12 hover:border-white/40';

export const opsCardPrimary =
  'inline-flex items-center justify-center px-3.5 py-2 rounded-full bg-[#C8A24C] text-black text-sm font-medium min-h-11 cursor-pointer hover:bg-[#F7E7B5] disabled:opacity-60';

export const opsCardGhost =
  'inline-flex items-center justify-center px-3.5 py-2 rounded-full border border-white/15 text-sm text-white min-h-11 cursor-pointer hover:border-white/40 disabled:opacity-60';

export const opsCardDanger =
  'inline-flex items-center justify-center px-3.5 py-2 rounded-full border border-rose-400/35 text-sm text-rose-200 min-h-11 cursor-pointer disabled:opacity-40';

export const opsCardFieldClass =
  'w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A24C] focus:outline-none min-h-11';

export function opsChipClass(on: boolean) {
  return `px-4 py-2 rounded-full text-sm min-h-11 border ${
    on ? 'bg-[#C8A24C] text-black border-[#C8A24C]' : 'border-white/15 text-white/70'
  }`;
}

export function OpsDeskStack({ children }: { children: ReactNode }) {
  return <div className="grid gap-5">{children}</div>;
}

export function OpsPageHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
      <h2 className="text-2xl font-light shrink-0">{title}</h2>
      {hint ? (
        <p className="text-sm text-white/45 font-light leading-relaxed max-w-xl min-w-[12rem] flex-1">{hint}</p>
      ) : null}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function OpsBand({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 px-4 py-3 grid gap-3">
      {title ? <h3 className="text-sm text-white/50 font-light">{title}</h3> : null}
      {children}
    </section>
  );
}

export function OpsToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col lg:flex-row lg:items-end gap-3">{children}</div>;
}

export function OpsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-sm text-white/50 font-light">{title}</h3>
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

export function OpsEmptyList({ children }: { children: ReactNode }) {
  return <p className="py-8 px-4 text-sm text-white/40">{children}</p>;
}

export function OpsCardTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <h3 className="text-base font-light text-[#C8A24C] leading-snug">{children}</h3>
      {sub ? <p className="text-xs text-white/45 mt-0.5 break-all leading-snug">{sub}</p> : null}
    </div>
  );
}

export function OpsCardActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>;
}

export function OpsFacts({ children }: { children: ReactNode }) {
  return <div className="grid gap-1">{children}</div>;
}

export function OpsFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="flex gap-2 text-sm leading-5">
      <span className="text-white/40 shrink-0">{label}</span>
      <span className="min-w-0 break-words text-white/90">{children}</span>
    </p>
  );
}

export function OpsListRow({
  active,
  onClick,
  title,
  meta,
  status,
  statusClass = 'text-[#C8A24C]',
}: {
  active?: boolean;
  onClick: () => void;
  title: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  statusClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={`w-full text-right px-4 py-3 min-h-12 border-s-2 ${
        active ? 'bg-[#C8A24C]/10 border-[#C8A24C]' : 'border-transparent hover:bg-white/[0.03]'
      }`}
    >
      <span className="block text-base text-white font-light">{title}</span>
      {meta || status ? (
        <span className="block text-xs text-white/50 mt-0.5">
          {meta}
          {meta && status ? ' · ' : null}
          {status ? <span className={statusClass}>{status}</span> : null}
        </span>
      ) : null}
    </button>
  );
}

export function OpsMasterDetail({
  list,
  detail,
  hasSelection,
  emptyDetail = 'בחרו שורה מהרשימה.',
  onCloseDetail,
}: {
  list: ReactNode;
  detail: ReactNode;
  hasSelection: boolean;
  emptyDetail?: string;
  onCloseDetail?: () => void;
}) {
  return (
    <>
      {hasSelection && onCloseDetail ? (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-30 bg-black/70"
          aria-label="סגירת כרטיס"
          onClick={onCloseDetail}
        />
      ) : null}
      <div className="grid md:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem] gap-4 items-start">
        <div className="border border-white/10 rounded-2xl overflow-hidden md:max-h-[calc(100vh-12rem)] md:overflow-y-auto">
          {list}
        </div>
        <aside
          className={`rounded-2xl p-4 md:sticky md:top-20 ${
            hasSelection
              ? 'border border-[#C8A24C]/35 max-md:fixed max-md:inset-y-0 max-md:end-0 max-md:z-40 max-md:w-[min(100%,20rem)] max-md:bg-[#0a0a0a] max-md:overflow-y-auto max-md:rounded-none max-md:border-y-0 max-md:border-s-0'
              : 'border border-white/10 max-md:hidden'
          }`}
        >
          {hasSelection ? (
            <div className="grid gap-3">
              {onCloseDetail ? (
                <button
                  type="button"
                  onClick={onCloseDetail}
                  className="md:hidden text-sm text-white/50 hover:text-white min-h-11 w-fit px-1"
                >
                  סגירה
                </button>
              ) : null}
              {detail}
            </div>
          ) : (
            <p className="text-sm text-white/40">{emptyDetail}</p>
          )}
        </aside>
      </div>
    </>
  );
}

export function useOpsSelection(ids: string[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closedRef = useRef(false);
  const idsKey = ids.join('\0');

  useEffect(() => {
    if (closedRef.current) return;
    const next = idsKey ? idsKey.split('\0') : [];
    if (selectedId && next.includes(selectedId)) return;
    setSelectedId(next[0] ?? null);
  }, [idsKey, selectedId]);

  const select = (id: string) => {
    closedRef.current = false;
    setSelectedId(id);
  };

  const close = () => {
    closedRef.current = true;
    setSelectedId(null);
  };

  return { selectedId, select, close };
}
