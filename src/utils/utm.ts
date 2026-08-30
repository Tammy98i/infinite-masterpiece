const STORAGE_KEY = 'mc_utm';

export type UtmParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  landingPage?: string;
  referrer?: string;
};

function readParam(search: string, key: string) {
  const value = new URLSearchParams(search).get(key)?.trim() || '';
  return value.slice(0, 120) || undefined;
}

export function captureUtmFromSearch(search: string) {
  const next: UtmParams = {
    utmSource: readParam(search, 'utm_source'),
    utmMedium: readParam(search, 'utm_medium'),
    utmCampaign: readParam(search, 'utm_campaign'),
    utmTerm: readParam(search, 'utm_term'),
    utmContent: readParam(search, 'utm_content'),
    gclid: readParam(search, 'gclid'),
    fbclid: readParam(search, 'fbclid'),
  };
  if (typeof window !== 'undefined') {
    next.landingPage = `${window.location.pathname}${window.location.search}`.slice(0, 500);
    next.referrer = document.referrer ? document.referrer.slice(0, 500) : undefined;
  }
  if (!Object.values(next).some(Boolean)) return;
  try {
    const prev = getStoredUtm();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...next }));
  } catch {
    /* private mode */
  }
}

export function getStoredUtm(): UtmParams {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UtmParams;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function utmAsRecord(params: UtmParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (params.utmSource) out.utmSource = params.utmSource;
  if (params.utmMedium) out.utmMedium = params.utmMedium;
  if (params.utmCampaign) out.utmCampaign = params.utmCampaign;
  if (params.utmTerm) out.utmTerm = params.utmTerm;
  if (params.utmContent) out.utmContent = params.utmContent;
  if (params.gclid) out.gclid = params.gclid;
  if (params.fbclid) out.fbclid = params.fbclid;
  if (params.landingPage) out.landingPage = params.landingPage;
  if (params.referrer) out.referrer = params.referrer;
  return out;
}
