export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function appUrl() {
  return String(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function corsOrigins(): string[] | true {
  if (!isProduction()) return true;
  const origin = appUrl();
  return origin ? [origin] : true;
}
