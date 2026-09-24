/** Gold monogram for CRM person rows (Netflix desk language). */
export function deskInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
}

export function DeskMonogram({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`crm-desk-mono ${className}`.trim()} aria-hidden>
      {deskInitials(name)}
    </span>
  );
}
