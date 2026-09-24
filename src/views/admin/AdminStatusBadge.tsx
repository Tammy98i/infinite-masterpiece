import type { ReactNode } from 'react';

export function AdminStatusBadge({ tone = 'neutral', children }: { tone?: 'success' | 'warning' | 'danger' | 'neutral'; children: ReactNode }) {
  const styles = {
    success: 'text-emerald-200',
    warning: 'text-[#dfc47d]',
    danger: 'text-rose-200',
    neutral: 'text-white/55',
  };
  return <span className={`text-[11px] ${styles[tone]}`}>{children}</span>;
}
