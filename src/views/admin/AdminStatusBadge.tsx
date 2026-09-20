import type { ReactNode } from 'react';
export function AdminStatusBadge({ tone = 'neutral', children }: { tone?: 'success' | 'warning' | 'danger' | 'neutral'; children: ReactNode }) {
  const styles = { success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200', warning: 'border-[#b79043]/30 bg-[#b79043]/10 text-[#dfc47d]', danger: 'border-rose-400/25 bg-rose-400/10 text-rose-200', neutral: 'border-white/10 bg-white/5 text-white/55' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${styles[tone]}`}>{children}</span>;
}
