import { formatClock } from '../utils/time';
import { Bidi } from './Bidi';

export function ClockLabel({ seconds, className }: { seconds: number; className?: string }) {
  return (
    <Bidi kind="clock" className={className}>
      {formatClock(seconds)}
    </Bidi>
  );
}
