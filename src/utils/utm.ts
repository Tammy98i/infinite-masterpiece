const STORAGE_KEY = 'mc_utm';

export type UtmParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
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
  };
  if (!Object.values(next).some(Boolean)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
  if (params.utmSource) out.utm_source = params.utmSource;
  if (params.utmMedium) out.utm_medium = params.utmMedium;
  if (params.utmCampaign) out.utm_campaign = params.utmCampaign;
  if (params.utmTerm) out.utm_term = params.utmTerm;
  if (params.utmContent) out.utm_content = params.utmContent;
  return out;
}
