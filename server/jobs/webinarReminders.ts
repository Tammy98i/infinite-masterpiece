import {
  listPartialFollowupCandidates,
  listWebinarReminderCandidates,
  markWebinarReminderSent,
} from '../services/webinarService.js';
import { sendWebinarPartialEmail, sendWebinarReminderEmail } from '../services/webinarEmailService.js';

export async function processWebinarReminders() {
  for (const kind of ['24h', '1h'] as const) {
    const candidates = listWebinarReminderCandidates(kind);
    for (const candidate of candidates) {
      try {
        const result = await sendWebinarReminderEmail(
          {
            fullName: candidate.fullName,
            email: candidate.email,
            registrationId: candidate.id,
          },
          kind
        );
        if (result.sent) {
          markWebinarReminderSent(candidate.id, kind);
        }
      } catch {
        /* best effort */
      }
    }
  }

  for (const candidate of listPartialFollowupCandidates()) {
    try {
      const result = await sendWebinarPartialEmail({
        fullName: candidate.fullName,
        email: candidate.email,
        registrationId: candidate.id,
      });
      if (result.sent) {
        markWebinarReminderSent(candidate.id, 'partial');
      }
    } catch {
      /* best effort */
    }
  }
}

export function startWebinarReminderScheduler() {
  const run = () => {
    void processWebinarReminders().catch(() => undefined);
  };
  run();
  setInterval(run, 15 * 60 * 1000);
}
