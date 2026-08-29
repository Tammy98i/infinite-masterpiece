const STORAGE_KEY = 'mc_password_recovery';
const EXPECT_KEY = 'mc_expect_password_recovery';

function canUseSessionStorage() {
  return typeof sessionStorage !== 'undefined';
}

export function markPasswordRecovery() {
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(STORAGE_KEY, '1');
}

export function markExpectedPasswordRecovery() {
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(EXPECT_KEY, '1');
}

export function clearPasswordRecovery() {
  if (!canUseSessionStorage()) return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(EXPECT_KEY);
}

export function takePasswordRecovery() {
  if (!canUseSessionStorage()) return false;
  const pending = sessionStorage.getItem(STORAGE_KEY) === '1';
  if (pending) sessionStorage.removeItem(STORAGE_KEY);
  return pending;
}

export function takeExpectedPasswordRecovery() {
  if (!canUseSessionStorage()) return false;
  const pending = sessionStorage.getItem(EXPECT_KEY) === '1';
  if (pending) sessionStorage.removeItem(EXPECT_KEY);
  return pending;
}

export function shouldOpenPasswordReset(fromUrl: boolean) {
  return fromUrl || takePasswordRecovery() || takeExpectedPasswordRecovery();
}
