import type { HTMLAttributes, ReactNode } from 'react';

type BidiKind = 'ltr' | 'phone' | 'email' | 'clock' | 'url';

const KIND_CLASS: Record<BidiKind, string> = {
  ltr: 'bidi-ltr',
  phone: 'bidi-phone',
  email: 'bidi-email',
  clock: 'bidi-clock',
  url: 'bidi-url',
};

type BidiProps = {
  children: ReactNode;
  kind?: BidiKind;
} & Omit<HTMLAttributes<HTMLElement>, 'children'>;

/** Isolates mixed Latin / numeric runs so Hebrew punctuation does not reorder them. */
export function Bidi({ children, kind = 'ltr', className, ...rest }: BidiProps) {
  const classes = [KIND_CLASS[kind], className].filter(Boolean).join(' ');
  return (
    <bdi dir="ltr" data-bidi="ltr" className={classes} {...rest}>
      {children}
    </bdi>
  );
}
