import { ArrowLeft, ArrowRight } from 'lucide-react';

/** Back / parent — points to inline-start (right in Hebrew). */
export function DirBack({ className = 'w-4 h-4' }: { className?: string }) {
  return <ArrowRight className={className} data-icon="dir-back" aria-hidden />;
}

/** Next / forward — points to inline-end (left in Hebrew). */
export function DirNext({ className = 'w-4 h-4' }: { className?: string }) {
  return <ArrowLeft className={`icon-dir-next ${className}`} data-icon="dir-next" aria-hidden />;
}
