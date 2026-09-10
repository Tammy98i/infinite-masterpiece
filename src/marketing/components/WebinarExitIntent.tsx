const PREFILL_KEY = 'webinar_exit_email';

/** Prefill leftover from a previous session; the exit-intent popup is not shown on /webinar. */
export function consumeWebinarExitEmailPrefill() {
  try {
    const value = sessionStorage.getItem(PREFILL_KEY)?.trim() || '';
    if (value) sessionStorage.removeItem(PREFILL_KEY);
    return value;
  } catch {
    return '';
  }
}
