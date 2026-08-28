export const WEBINAR_PUNCHLINE = 'לא עוד השראה. פעולה. מערכת. פרנסה.';

export const WEBINAR_HOLDING_LINE =
  'אם בסוף הערב תצאו רק עם רעיון, נכשלנו. אם תצאו עם פעולה שבוצעה, התחלנו.';

export const WEBINAR_AUDIENCE_LABEL = 'יוצרים, אמנים, מומחים ובעלי עסקים יצירתיים';

export const WEBINAR_REGISTER_ID = 'webinar-register';
export const WEBINAR_CTA_PRIMARY = 'כן. אני מגיע/ה לערב החי';
export const WEBINAR_CTA_SHORT = 'אני מגיע/ה';
export const WEBINAR_CTA_HEADER = 'אני מגיע/ה לערב החי';
export const WEBINAR_CTA_FIT = 'כן. זה מתאים לי. אני מגיע/ה';
export const WEBINAR_CTA_FAQ = 'נשארה שאלה? אני מגיע/ה ונענה בלייב';
export const WEBINAR_CTA_FIT_LINK = 'רוצה לדעת אם זה בשבילך?';
export const WEBINAR_CTA_ENTER = 'כניסה לערב החי';
export const WEBINAR_CTA_NOT_REGISTERED = 'עדיין לא נרשמת? הרשמה למטה';
export const WEBINAR_CTA_ZOOM_WHATSAPP = 'הקישור בוואטסאפ';
export const WEBINAR_CTA_ENDED = 'הערב החי הסתיים';
export const WEBINAR_CTA_NEXT_CYCLE = 'בדיקת התאמה למחזור הבא';
export const WEBINAR_CTA_NEXT_CYCLE_SHORT = 'מחזור הבא';
export const WEBINAR_ENDED_NOTE = 'אם תהיה הקלטה, נעדכן. תודה שהגעתם.';

export function webinarLiveEnter(zoomLink: string, whatsappGroupUrl: string) {
  const zoom = zoomLink.trim();
  if (zoom) return { href: zoom, label: WEBINAR_CTA_ENTER };
  const whatsapp = whatsappGroupUrl.trim();
  if (whatsapp) return { href: whatsapp, label: WEBINAR_CTA_ZOOM_WHATSAPP };
  return { href: '', label: WEBINAR_CTA_ZOOM_WHATSAPP };
}

export const WEBINAR_DIFFERENCE_POINTS = [
  {
    title: 'שיעור מכירות אמיתי',
    text: 'לא לחץ. לא מניפולציה. אבחון, בהירות, ערך וצעד הבא שאפשר לבצע הערב.',
  },
  {
    title: 'משימת ביצוע בזמן אמת',
    text: 'תוצר אחד. אדם אחד. פעולה אחת שנשלחת לעולם לפני שהערב נגמר.',
  },
  {
    title: 'הזמנה לפיילוט הראשון',
    text: 'מסע של 33 ימים למי שמתאים ורוצה להמשיך. לא חובה הערב.',
  },
] as const;

export const WEBINAR_BOTTLENECKS = [
  { title: 'הצעה', text: 'מה בדיוק קונים ממך?' },
  { title: 'מכירה', text: 'איך הופכים עניין להחלטה?' },
  { title: 'שיווק', text: 'איך מייצרים מספיק שיחות?' },
  { title: 'תפעול', text: 'איך חוזרים על זה בלי להישרף?' },
  { title: 'מדידה', text: 'איך יודעים מה באמת עובד?' },
] as const;

export const WEBINAR_VALUE_CHAIN = ['יצירה', 'ערך', 'הצעה', 'שיחה', 'הכנסה'] as const;

export const WEBINAR_TIMELINE = [
  {
    title: 'פתיחה: למה עכשיו?',
    text: 'הבעיה, השוק, הכאב והפער בין כישרון להכנסה.',
  },
  {
    title: 'שיעור מכירות הוליסטי (45 דקות)',
    text: 'לא “איך לסגור בכוח”. איך לאבחן, להבין, לשאול, לבנות אמון ולייצר החלטה.',
  },
  {
    title: 'משימת ביצוע חיה (20 דקות)',
    text: 'תוצר אחד. אדם אחד. פעולה אחת שנשלחת לעולם בזמן אמת.',
  },
  {
    title: 'קונסטלציית הצוות',
    text: 'היכרות עם האנשים שבונים את Infinite Masterpiece.',
  },
  {
    title: 'המיזם והפיילוט',
    text: 'איך הרעיון הפך לפיילוט של 33 ימים.',
  },
  {
    title: 'שקיפות ותנאים',
    text: 'אחריות, ביטולים, פרטיות, תקנון וכללי משחק.',
  },
  {
    title: 'מסלולי הצטרפות',
    text: 'אמיצים או הססנים. שתי דרכי כניסה לפיילוט.',
  },
  {
    title: 'Q&A והצעד הבא',
    text: 'שאלות, החלטה והמשך פעולה.',
  },
] as const;

export const WEBINAR_SALES_PRINCIPLES = [
  'אבחון לפני הצעה',
  'בהירות לפני שכנוע',
  'ערך לפני מחיר',
  'שאלות לפני מונולוג',
  'הוכחה לפני הבטחה',
  'התנגדות = מידע',
  'צעד הבא ברור',
  'מדידה לפני תחושת בטן',
] as const;

export const WEBINAR_TASK_STEPS = [
  {
    title: 'בהירות',
    text: 'אני עוזר/ת ל ___ להשיג ___ באמצעות ___.',
  },
  {
    title: 'הצעה',
    text: 'לבחור הצעה אחת שאפשר להזמין אליה היום.',
  },
  {
    title: 'שליחה',
    text: 'לשלוח לאדם אחד מתאים.',
  },
  {
    title: 'תיעוד',
    text: 'מה שלחתי, למי, מה קרה ומה למדתי.',
  },
] as const;

export const WEBINAR_FIT_YES = [
  'יש לך כישרון, ידע, יצירה או מומחיות.',
  'את/ה רוצה להפוך את זה להכנסה ברורה יותר.',
  'קשה לך למכור את עצמך.',
  'יש לך רעיון אבל אין לך הצעה מספיק ברורה.',
  'את/ה מרגיש/ה שיש לך יותר ערך ממה שהשוק רואה.',
  'את/ה רוצה מערכת ביצוע, לא עוד השראה.',
  'את/ה מוכן/ה לעשות פעולה אמיתית בזמן הוובינר.',
] as const;

export const WEBINAR_FIT_NO = [
  'את/ה מחפש/ת כסף קל.',
  'את/ה רוצה רק לצפות מהצד.',
  'אין לך כוונה לבצע.',
  'את/ה מצפה לתוצאה בלי אחריות אישית.',
  'את/ה מחפש/ת הבטחת הכנסה ודאית.',
] as const;

export const WEBINAR_GLEB = {
  name: 'גלב סמירנוב',
  title: 'CCO בפועל / קריאייטיב / תוכן / צילום / מותג',
  bio: 'מוביל את שכבת הקריאייטיב, השפה הוויזואלית, התוכן והמותג.',
};

export const WEBINAR_ECOSYSTEM = [
  { title: 'שידור על', text: 'מפגש חי שמרכז את התנועה. לא עוד שידור השראה.' },
  { title: 'קהילה', text: 'אנשים שיוצרים, מוכרים ומבצעים יחד. לא לבד מול המסך.' },
  { title: 'Pods', text: 'קבוצות קטנות שמחזיקות ביצוע, אחריות וקצב.' },
  { title: 'Captains', text: 'מובילים שמחברים בין המערכת לאנשים שבתוכה.' },
  { title: 'ספריית אינסוף', text: 'שכבת תוכן בתוך האקוסיסטם. לא מנוי נפרד בוובינר הזה.' },
  { title: 'נבחרת 88', text: 'הצוות והשותפים שבונים את המערכת סביב היצירה.' },
] as const;

export const WEBINAR_PILOT_DAYS = [
  { title: 'יום 0', text: 'Onboarding, היכרות ומפת המסע.' },
  { title: 'ימים 1 עד 8', text: 'מכירות, השפעה, שיחה, מעקב ומשא ומתן.' },
  { title: 'ימים 9 עד 16', text: 'שיווק, מיתוג, בידול, תוכן וערוצים.' },
  { title: 'ימים 17 עד 24', text: 'מוצר, תמחור, CRM, תפעול וטכנולוגיה.' },
  { title: 'ימים 25 עד 32', text: 'פיננסים, זכויות, קהילה ושותפויות.' },
  { title: 'יום 33', text: 'תוצאות, Next 90 Days ומעבר להמשך.' },
] as const;

export const WEBINAR_TRANSPARENCY_POINTS = [
  'לא מבטיחים הכנסה ודאית.',
  'לא מחליפים ייעוץ משפטי / פיננסי / טיפולי.',
  'האחריות הסופית תיקבע במסמכים משפטיים מאושרים.',
  'הפיילוט כולל למידה, ביצוע, מדידה ושקיפות.',
] as const;

export const WEBINAR_TRACKS_FINE_PRINT =
  'שני המסלולים יוצגו בסוף הערב. לא נדרש להחליט עכשיו. מסלול ההססנים הוא אותו יעד בפריסה. לא הנחה ולא מוצר חלקי.';
