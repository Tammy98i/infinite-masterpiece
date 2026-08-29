/** PKCE `?code=` is single-use. detectSessionInUrl already exchanges it on boot. */
export function shouldExchangeAuthCode(hasSession: boolean, code: string | null | undefined) {
  return Boolean(code?.trim()) && !hasSession;
}
