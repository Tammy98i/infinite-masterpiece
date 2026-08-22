const STORAGE_KEY = 'mc_ref_lecturer';

function isLecturerRef(value: string) {
  return /^[a-zA-Z0-9_-]{1,80}$/.test(value);
}

export function captureReferralFromSearch(search: string) {
  const ref = new URLSearchParams(search).get('ref')?.trim() || '';
  if (!isLecturerRef(ref)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, ref);
  } catch {
    /* private mode */
  }
}

export function getStoredReferralLecturerId(): string | undefined {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)?.trim() || '';
    return isLecturerRef(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
