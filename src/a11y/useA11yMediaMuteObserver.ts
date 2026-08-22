import { useEffect } from 'react';
import { a11yStore } from './prefs';

/** Re-apply mute when new video/audio nodes mount while mute preference is active. */
export function useA11yMediaMuteObserver() {
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const prefs = a11yStore.getSnapshot();
      if (!prefs.muteMedia) return;
      document.querySelectorAll('video, audio').forEach((node) => {
        (node as HTMLMediaElement).muted = true;
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}
