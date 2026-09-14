import { WEBINAR_FAQ } from './webinar';
import type { WebinarPhase } from '../utils/webinarTime';
import {
  WEBINAR_CTA_ENTER,
  WEBINAR_CTA_FIT,
  WEBINAR_CTA_FIT_LINK,
  WEBINAR_CTA_HEADER,
  WEBINAR_CTA_NOT_REGISTERED,
  WEBINAR_CTA_PRIMARY,
  WEBINAR_CTA_SHORT,
} from './webinarPage';

export const WEBINAR_WAITLIST_CTA = 'עדכנו אותי על המחזור הבא';
export const WEBINAR_WAITLIST_CTA_SHORT = 'עדכנו אותי';
export const WEBINAR_WAITLIST_SUBMIT = 'כן, עדכנו אותי';
export const WEBINAR_WAITLIST_FORM_TITLE = 'רוצים לדעת מתי המחזור הבא נפתח?';
export const WEBINAR_WAITLIST_TRUST = 'ללא תשלום וללא התחייבות. אפשר להסיר את עצמך בכל עת.';
export const WEBINAR_WAITLIST_MICRO = 'ללא התחייבות · נעדכן רק כשיש תאריך או הקלטה';

export const WEBINAR_ENDED_HEADLINE = 'הכישרון כבר יש. עכשיו בונים סביבו מערכת.';
export const WEBINAR_ENDED_SUBHEADLINE =
  'המחזור החי הסתיים. השאירו פרטים כדי לקבל עדכון על המחזור הבא, ההקלטה והמסלול המתאים לכם.';

export const WEBINAR_BUILD_TOGETHER = [
  { title: 'דיוק', text: 'מה שמתאים לך, בזמן הנכון.' },
  { title: 'מערכת', text: 'כלים, תהליכים וליווי שבונים תוצאות.' },
  { title: 'קהילה', text: 'אנשים איכותיים שצומחים יחד.' },
  { title: 'צמיחה והשפעה', text: 'מחשיבה למעשה וליצירת אימפקט אמיתי.' },
] as const;

export const WEBINAR_BUILD_BRIDGE = 'לכן בנינו ערב שעובר דרך כל ארבע השכבות.';

export const WEBINAR_FIT_YES_SHORT = [
  'יש לך כישרון, ידע, יצירה או מומחיות.',
  'את/ה רוצה להפוך את זה להכנסה ברורה יותר.',
  'קשה לך למכור את עצמך, או שחסרה הצעה ברורה.',
  'את/ה רוצה מערכת ביצוע, לא עוד השראה.',
  'את/ה מוכן/ה לעשות צעד אמיתי כשהמחזור הבא ייפתח.',
] as const;

export const WEBINAR_FIT_NO_SHORT = [
  'את/ה מחפש/ת כסף קל.',
  'את/ה רוצה רק לצפות מהצד, בלי לבצע.',
  'אין לך כוונה לקחת אחריות על התוצאה.',
  'את/ה מצפה לתוצאה בלי פעולה אישית.',
  'את/ה מחפש/ת הבטחת הכנסה ודאית.',
] as const;

const ENDED_FAQ_OVERRIDES: Record<string, string> = {
  'האם הערב בתשלום?':
    'השארת פרטים לרשימת העדכון היא ללא עלות ובלי כרטיס אשראי. מסלולי הפיילוט יוצגו במחזור הבא, רק למי שמתאים ורוצה להמשיך.',
  'כמה זמן זה נמשך?':
    'המחזור החי ארך כ־150 דקות. אורך המחזור הבא יפורסם יחד עם התאריך.',
  'האם חייבים להגיע בלייב?':
    'המחזור החי הסתיים. אם ייפתח מועד חדש או תישלח הקלטה, נעדכן את מי שהשאיר פרטים.',
  'האם תהיה הקלטה?':
    'אם תהיה הקלטה או מועד חדש, נשלח עדכון למי שנרשם לרשימה. אין הבטחה מראש שתהיה הקלטה.',
  'מה קורה אחרי הוובינר?':
    'מי שירצה ויתאים יוכל לבחור מסלול כניסה לפיילוט כשהמחזור הבא ייפתח: אמיצים או הססנים.',
  'מה מביאים?':
    'כרגע מספיק להשאיר פרטים. לקראת המחזור הבא נעדכן מה כדאי להכין.',
  'צריך מצלמה?':
    'במחזור החי זה לא היה חובה. אם ייפתח מועד חדש, נפרט את כללי ההשתתפות מראש.',
};

const LIVE_FAQ_OVERRIDES: Record<string, string> = {
  'האם חייבים להגיע בלייב?': 'כן. הערב קורה עכשיו. היכנסו לשידור כדי לא לפספס את משימת הביצוע.',
  'האם תהיה הקלטה?': 'הערב מיועד להשתתפות חיה עכשיו. אם תישלח הקלטה אחר כך, נעדכן.',
};

export function webinarCopy(phase: WebinarPhase) {
  if (phase === 'ended') {
    return {
      headerCta: WEBINAR_WAITLIST_CTA,
      headerCtaShort: WEBINAR_WAITLIST_CTA_SHORT,
      primaryCta: WEBINAR_WAITLIST_CTA,
      stickyCta: WEBINAR_WAITLIST_CTA,
      stickyCtaShort: WEBINAR_WAITLIST_CTA_SHORT,
      fitCta: WEBINAR_WAITLIST_CTA,
      fitLink: 'רוצה לדעת אם זה בשבילך?',
      formEyebrow: 'רשימת עדכון',
      formTitle: WEBINAR_WAITLIST_FORM_TITLE,
      formSubmit: WEBINAR_WAITLIST_SUBMIT,
      formTrust: WEBINAR_WAITLIST_TRUST,
      heroHeadline: WEBINAR_ENDED_HEADLINE,
      heroSubheadline: WEBINAR_ENDED_SUBHEADLINE,
      heroMicro: WEBINAR_WAITLIST_MICRO,
      hostsLead: '{hosts} הובילו את המחזור החי. השיטה נשארת: בהירות, הצעה, פעולה.',
      hostsLabel: 'המנחים',
      stepsTitle: 'מה תצאו איתו מהערב',
      footerRegister: 'עדכון',
      registerAria: 'השארת פרטים לעדכון על המחזור הבא',
      waitlistMode: true as const,
    };
  }

  if (phase === 'live') {
    return {
      headerCta: WEBINAR_CTA_ENTER,
      headerCtaShort: WEBINAR_CTA_ENTER,
      primaryCta: WEBINAR_CTA_ENTER,
      stickyCta: WEBINAR_CTA_ENTER,
      stickyCtaShort: WEBINAR_CTA_ENTER,
      fitCta: WEBINAR_CTA_FIT,
      fitLink: WEBINAR_CTA_NOT_REGISTERED,
      formEyebrow: 'הרשמה לוובינר',
      formTitle: 'עדיין לא בפנים? נרשמים ונכנסים',
      formSubmit: WEBINAR_CTA_PRIMARY,
      formTrust: 'בלי כרטיס אשראי. לא מבטיחים הכנסה.',
      heroHeadline: '',
      heroSubheadline: '',
      heroMicro: '',
      hostsLead: '{hosts} בלייב עכשיו. שיעור מכירות, משימת ביצוע, ואז פעולה שנשלחת לעולם.',
      hostsLabel: 'הערב החי',
      stepsTitle: 'מה תצאו איתו מהערב',
      footerRegister: 'הרשמה',
      registerAria: 'הרשמה לוובינר',
      waitlistMode: false as const,
    };
  }

  return {
    headerCta: WEBINAR_CTA_HEADER,
    headerCtaShort: WEBINAR_CTA_SHORT,
    primaryCta: WEBINAR_CTA_PRIMARY,
    stickyCta: WEBINAR_CTA_PRIMARY,
    stickyCtaShort: WEBINAR_CTA_SHORT,
    fitCta: WEBINAR_CTA_FIT,
    fitLink: WEBINAR_CTA_FIT_LINK,
    formEyebrow: 'הרשמה לוובינר',
    formTitle: 'נרשמים לערב החי',
    formSubmit: WEBINAR_CTA_PRIMARY,
    formTrust: 'בלי כרטיס אשראי. לא מבטיחים הכנסה.',
    heroHeadline: '',
    heroSubheadline: '',
    heroMicro: '',
    hostsLead: '{hosts} בלייב. שיעור מכירות, משימת ביצוע, ואז פעולה שנשלחת לעולם.',
    hostsLabel: 'המנחים',
    stepsTitle: 'מה תצאו איתו מהערב',
    footerRegister: 'הרשמה',
    registerAria: 'הרשמה לוובינר',
    waitlistMode: false as const,
  };
}

export function webinarFaqForPhase(phase: WebinarPhase): Array<{ q: string; a: string }> {
  const overrides = phase === 'ended' ? ENDED_FAQ_OVERRIDES : phase === 'live' ? LIVE_FAQ_OVERRIDES : {};
  return WEBINAR_FAQ.map((item) => ({
    q: item.q,
    a: overrides[item.q] ?? item.a,
  }));
}

export const WEBINAR_FAQ_PREVIEW_COUNT = 6;
