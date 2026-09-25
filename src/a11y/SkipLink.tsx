/** Hebrew skip-to-content link (IS 5568 / WCAG 2.4.1). */
export function SkipLink({ href = '#main-content' }: { href?: string }) {
  return (
    <a href={href} className="skip-link">
      דלג לתוכן הראשי
    </a>
  );
}
