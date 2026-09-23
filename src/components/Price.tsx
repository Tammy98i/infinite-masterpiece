import { Bidi } from './Bidi';

export function Price({ amount, className }: { amount: number; className?: string }) {
  return (
    <Bidi kind="ltr" className={['price tabular-nums', className].filter(Boolean).join(' ')}>
      {amount.toLocaleString('he-IL')}
      {'\u00a0'}₪
    </Bidi>
  );
}
