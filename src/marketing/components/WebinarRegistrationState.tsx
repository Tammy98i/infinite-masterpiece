import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { WEBINAR_CTA_NEXT_CYCLE } from '../../constants/webinarPage';

/** Keep the expired event's form unmounted, including its resume side effects. */
export function WebinarRegistrationState({ ready, ended, enabled, children }: {
  ready: boolean;
  ended: boolean;
  enabled: boolean;
  children: ReactNode;
}) {
  if (!ready) return <p role="status">בודקים את מצב ההרשמה…</p>;
  if (ended) return (
    <div className="webinar-registration-status">
      <h2>ממשיכים מכאן</h2>
      <p>ההרשמה לערב הזה נסגרה. אפשר להכיר את מסלולי ההמשך ולבדוק מה מתאים לך.</p>
      <Link to="/#pricing" className="btn-gold">{WEBINAR_CTA_NEXT_CYCLE}</Link>
    </div>
  );
  if (!enabled) return <p role="status">ההרשמה אינה פתוחה כרגע. אפשר לחזור לעמוד בהמשך.</p>;
  return <>{children}</>;
}
