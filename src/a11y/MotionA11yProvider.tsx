import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { useA11yPrefs } from './prefs';

export function MotionA11yProvider({ children }: { children: ReactNode }) {
  const { reduceMotion } = useA11yPrefs();
  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      {children}
    </MotionConfig>
  );
}
