export const WEBINAR_BLOCKER_OPTIONS = [
  'לא יודע/ת מה למכור',
  'מפחד/ת ממכירות',
  'לא יודע/ת איך לתמחר',
  'אין מספיק לקוחות',
  'מתפזר/ת בשיווק',
  'אין לי מערכת',
  'רוצה סקייל',
  'אחר',
] as const;

export const WEBINAR_INTEREST_OPTIONS = [
  'איך להפוך כישרון להצעה',
  'מכירה לפני שיווק',
  'בניית מערכת סביב היצירה',
  'הפיילוט הראשון של Infinite Masterpiece',
  'הכל מעניין',
] as const;

export type WebinarSocialProofQuote = {
  quote: string;
  author: string;
  role?: string;
};

export type WebinarConfig = {
  enabled: boolean;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  location: string;
  costLabel: string;
  spotsLabel: string;
  whatsappGroupUrl: string;
  calendarLocation: string;
  zoomLink: string;
  leaderPrimaryName: string;
  leaderPrimaryTitle: string;
  leaderPrimaryBio: string;
  leaderSecondaryName: string;
  leaderSecondaryTitle: string;
  leaderSecondaryBio: string;
  heroHeadline: string;
  heroHeadlineVariantB: string;
  heroSubheadline: string;
  abTestEnabled: boolean;
  showRegistrationCount: boolean;
  maxSpots: number;
  showSpotsRemaining: boolean;
  socialProofQuotes: WebinarSocialProofQuote[];
};

export type WebinarPublicPayload = {
  config: WebinarConfig;
  registrationCount: number;
  completeCount: number;
  spotsRemaining: number | null;
  isWaitlist: boolean;
  abVariant: 'a' | 'b';
  activeHeadline: string;
};

export const DEFAULT_WEBINAR_SOCIAL_PROOF: WebinarSocialProofQuote[] = [
  {
    quote: 'סוף סוף הבנתי מה אפשר למכור — בלי לחכות לעוד קורס.',
    author: 'יוצר/ת תוכן',
    role: 'מעצב/ת',
  },
  {
    quote: 'הגישה של קודם מכירה ואחר כך שיווק שינתה לי את הראש.',
    author: 'מאמן/ת',
    role: 'עסק יצירתי',
  },
];

export const DEFAULT_WEBINAR_CONFIG: WebinarConfig = {
  enabled: true,
  title: 'וובינר פתיחה — Infinite Masterpiece',
  date: '26.05.2026',
  time: '20:00',
  durationMinutes: 90,
  location: 'אונליין (Zoom)',
  costLabel: 'ללא עלות · הרשמה מוקדמת',
  spotsLabel: 'מקומות מוגבלים',
  whatsappGroupUrl: '',
  calendarLocation: 'Zoom',
  zoomLink: '',
  leaderPrimaryName: 'גל אברמוביץ׳',
  leaderPrimaryTitle: 'Founder & Vision Lead',
  leaderPrimaryBio:
    'גל מוביל את החזון, השפה והתפיסה העסקית של Infinite Masterpiece — מערכת שנבנית כדי לעזור ליוצרים ואנשים יצירתיים לסגור את הפער בין כישרון להכנסה, דרך ביצוע, קהילה, מכירה ותשתית עסקית.',
  leaderSecondaryName: 'תמי אליאן',
  leaderSecondaryTitle: 'Co-Founder / CTO & Product Architect',
  leaderSecondaryBio:
    'מובילה את הצד הטכנולוגי והמוצרי של Infinite Masterpiece — מהאתר, דרך ספריית ה־VOD, אזור המשתמשים, הדשבורדים, המדידה והאוטומציות.',
  heroHeadline: 'יש לך יצירה. עכשיו בונים לה מערכת הכנסה.',
  heroHeadlineVariantB: 'איך הופכים כישרון, ידע או יצירה להצעה שאנשים באמת רוצים לקנות',
  heroSubheadline:
    'וובינר פתיחה ליוצרים, אמנים ואנשים יצירתיים שרוצים להבין איך הופכים כישרון, ידע או יצירה להצעה שאנשים רוצים לקנות — ומשם לבנות שיווק, קהילה, תוכן ומערכת עסקית.',
  abTestEnabled: false,
  showRegistrationCount: true,
  maxSpots: 0,
  showSpotsRemaining: false,
  socialProofQuotes: DEFAULT_WEBINAR_SOCIAL_PROOF,
};

export const WEBINAR_FAQ = [
  {
    q: 'האם הוובינר מתאים גם למי שאין לו עסק עדיין?',
    a: 'כן, אם יש לך כישרון, ידע, יצירה או מומחיות ואת/ה רוצה להבין איך להפוך את זה להצעה ברורה.',
  },
  {
    q: 'האם זו הרצאת מכירה?',
    a: 'זה וובינר תוכן עם הצגה של הפיילוט הראשון. תהיה אפשרות להצטרף למי שירצה להמשיך.',
  },
  {
    q: 'האם תהיה הקלטה?',
    a: 'רק אם נחליט שכן. בינתיים מומלץ להגיע בלייב — כך מקבלים את המקסימום מהשיחה.',
  },
  {
    q: 'האם צריך ניסיון קודם?',
    a: 'לא. אבל צריך רצון לבצע.',
  },
  {
    q: 'האם תהיה אפשרות להצטרף למסלול אחרי הוובינר?',
    a: 'כן, למי שיימצא מתאים וירצה להמשיך.',
  },
] as const;

export function splitHeroHeadline(headline: string): { line1: string; line2: string } {
  const parts = headline.split('.').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { line1: `${parts[0]}.`, line2: parts.slice(1).join('. ') };
  }
  return { line1: headline, line2: '' };
}
