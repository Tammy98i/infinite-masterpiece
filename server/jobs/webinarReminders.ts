import {
  listWebinarReminderCandidates,
  markWebinarReminderSent,
} from '../services/webinarService.js';
import { sendWebinarReminderEmail } from '../services/webinarEmailService.js';

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
}

export function startWebinarReminderScheduler() {
  const run = () => {
    void processWebinarReminders().catch(() => undefined);
  };
  run();
  setInterval(run, 15 * 60 * 1000);
}
