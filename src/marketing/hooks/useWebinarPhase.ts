import { useEffect, useState } from 'react';
import { webinarApi } from '../../api/webinar';
import { DEFAULT_WEBINAR_CONFIG, type WebinarConfig } from '../../constants/webinar';
import { webinarLiveEnter } from '../../constants/webinarPage';
import { getWebinarPhase } from '../../utils/webinarTime';

export function useWebinarPhase() {
  const [config, setConfig] = useState<WebinarConfig>(DEFAULT_WEBINAR_CONFIG);
  const [now, setNow] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    webinarApi
      .config()
      .then((res) => {
        setConfig(res.config);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const phase = loaded
    ? getWebinarPhase(config.date, config.time, config.durationMinutes, now)
    : 'upcoming';
  const liveEnter = webinarLiveEnter(config.zoomLink, config.whatsappGroupUrl);

  return { config, phase, liveEnter, loaded };
}
