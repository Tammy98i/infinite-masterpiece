/**
 * PKCE `?code=` is single-use. detectSessionInUrl is off (src/lib/supabase.ts)
 * specifically so this explicit exchange is the only thing that ever
 * consumes it — skip only if a session already exists from local storage.
 */
export function shouldExchangeAuthCode(hasSession: boolean, code: string | null | undefined) {
  return Boolean(code?.trim()) && !hasSession;
}
