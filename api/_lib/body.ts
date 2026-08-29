export function jsonBody(req: { body?: unknown }): Record<string, unknown> {
  const raw = req.body;
  const text =
    typeof raw === 'string'
      ? raw
      : typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)
        ? raw.toString('utf8')
        : null;
  if (text != null) {
    try {
      const parsed = JSON.parse(text) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}
