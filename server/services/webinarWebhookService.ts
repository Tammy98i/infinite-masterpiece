type WebinarWebhookPayload = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  field: string;
  interest: string;
  blocker: string;
  status: string;
};

export async function postWebinarWebhook(payload: WebinarWebhookPayload) {
  const url = process.env.WEBINAR_WEBHOOK_URL?.trim();
  if (!url) return { sent: false };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'webinar',
      ...payload,
      createdAt: new Date().toISOString(),
    }),
  });
  return { sent: res.ok };
}
