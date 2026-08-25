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

export function OpsEmptyList({ children }: { children: ReactNode }) {
  return <p className="py-8 px-4 text-sm text-white/40">{children}</p>;
}

export function OpsFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="flex justify-between gap-3 text-sm">
      <span className="text-white/40 shrink-0">{label}</span>
      <span className="text-left min-w-0 break-words">{children}</span>
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
      className={`w-full text-right px-3 py-2.5 min-h-12 border-s-2 ${
        active ? 'bg-[#C8A24C]/10 border-[#C8A24C]' : 'border-transparent hover:bg-white/[0.03]'
      }`}
    >
      <span className="block text-sm text-white">{title}</span>
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
      <div className="grid md:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_22rem] gap-4 items-start">
        <div className="border border-white/10 rounded-2xl overflow-hidden md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
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
            <div className="grid gap-4">
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
