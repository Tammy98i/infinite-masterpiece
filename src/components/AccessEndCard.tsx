import { useEffect, useState } from 'react';
import { usePaywall } from '../context/PaywallContext';

type Props = {
  source: string;
  courseTitle?: string;
  onDismiss?: () => void;
  canPreview?: boolean;
  onPreview?: () => void;
};

/** Opens the shared paywall. The player no longer draws a second dialog. */
export function AccessEndCard({ source, courseTitle, onDismiss, canPreview, onPreview }: Props) {
  const { openPaywall, isOpen } = usePaywall();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    openPaywall({
      source,
      courseTitle,
      canPreview: Boolean(canPreview && onPreview),
      onPreview,
    });
    setArmed(true);
  }, [source, courseTitle, canPreview, onPreview, openPaywall]);

  useEffect(() => {
    if (armed && !isOpen) onDismiss?.();
  }, [armed, isOpen, onDismiss]);

  return null;
}
