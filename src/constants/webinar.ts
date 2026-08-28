export const WEBINAR_BLOCKER_OPTIONS = ['הצעה', 'מכירה', 'שיווק', 'תפעול', 'מדידה'] as const;

export const WEBINAR_INTEREST_OPTIONS = [
  'יש לי כישרון — עדיין אין עסק',
  'כבר מוכר/ת מדי פעם',
  'יש עסק פעיל — רוצה יציבות',
  'יש עסק יציב — רוצה סקייל',
  'אני כאן כדי ללמוד מכירות',
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
    quote: 'אם הערב ייגמר עם פעולה אחת אמיתית — זה כבר שווה לי להגיע.',
    author: 'מיכל',
    role: 'מעצבת תכשיטים',
  },
  {
    quote: 'אני יודע ליצור. אני לא יודע למכור בלי להרגיש זר לעצמי.',
    author: 'אורי',
    role: 'מאמן תנועה',
  },
  {
    quote: 'יש לי ערך. חסר לי צעד ברור. בשביל זה אני מגיעה לערב.',
    author: 'נועה',
    role: 'מטפלת',
  },
];

export const DEFAULT_WEBINAR_CONFIG: WebinarConfig = {
  enabled: true,
  title: 'וובינר פתיחה — Infinite Masterpiece',
  date: '26.05.2026',
  time: '20:00',
  durationMinutes: 150,
  location: 'אונליין / Zoom',
  costLabel: 'ללא עלות · הרשמה מוקדמת',
  spotsLabel: 'הרשמה פתוחה',
  whatsappGroupUrl: 'https://chat.whatsapp.com/EfdlOMLCGS70nvDoe6LTcT',
  calendarLocation: 'Zoom',
  zoomLink: '',
  leaderPrimaryName: 'גל אברמוביץ׳',
  leaderPrimaryTitle: 'Founder / Vision / Strategy / Teaching / Sales',
  leaderPrimaryBio:
    'מוביל את החזון, השפה, השיטה והמסגרת העסקית של Infinite Masterpiece — מהרעיון הגדול ועד הפיילוט הראשון.',
  leaderSecondaryName: 'תמי אליאן',
  leaderSecondaryTitle: 'CTO בפועל / אתרים / פלטפורמות / Mobile / Funnel',
  leaderSecondaryBio:
    'מובילה את הצד הטכנולוגי והמוצרי של המיזם: אתר, VOD, דאשבורדים, משפכים, מדידה ואפליקציה.',
  heroHeadline: 'יש לך יצירה. עכשיו בונים לה מערכת הכנסה.',
  heroHeadlineVariantB: 'יש לך יצירה. עכשיו בונים לה מערכת הכנסה.',
  heroSubheadline:
    'וובינר השקה חי של Infinite Masterpiece ליוצרים, אמנים ואנשים יצירתיים שרוצים לסגור את הפער בין כישרון להכנסה — דרך שיעור מכירות הוליסטי, ביצוע בזמן אמת והצצה לפיילוט הראשון.',
  abTestEnabled: false,
  showRegistrationCount: true,
  maxSpots: 0,
  showSpotsRemaining: false,
  socialProofQuotes: DEFAULT_WEBINAR_SOCIAL_PROOF,
};

export const WEBINAR_FAQ = [
  {
    q: 'האם הערב בתשלום?',
    a: 'לא. ההרשמה לוובינר ללא עלות, ובלי כרטיס אשראי. מסלולי הפיילוט מוצגים בסוף — ורק למי שמתאים ורוצה להמשיך.',
  },
  {
    q: 'כמה זמן זה נמשך?',
    a: 'כ־150 דקות בלייב, כולל שיעור מכירות, משימת ביצוע, הצוות והזמנה לפיילוט.',
  },
  {
    q: 'זה בעברית?',
    a: 'כן. הערב מועבר בעברית.',
  },
  {
    q: 'צריך מצלמה?',
    a: 'לא חובה. כן חשוב להיות נוכחים בזמן משימת הביצוע, לא רק ברקע.',
  },
  {
    q: 'מה מביאים?',
    a: 'שם של אדם אחד שעשוי להתאים להצעה שלכם, ומוכנות לשלוח פעולה אמיתית במהלך הערב.',
  },
  {
    q: 'האם זה וובינר מכירה?',
    a: 'זה וובינר תוכן, ביצוע והצגת הפיילוט. כן, בסוף תהיה אפשרות להצטרף למי שמתאים ורוצה להמשיך.',
  },
  {
    q: 'האם חייבים להגיע בלייב?',
    a: 'מומלץ מאוד, כי חלק מרכזי מהוובינר הוא משימת ביצוע חיה.',
  },
  {
    q: 'האם תהיה הקלטה?',
    a: 'הוובינר מיועד להשתתפות חיה. אם תישלח הקלטה לנרשמים — נעדכן מראש.',
  },
  {
    q: 'למי זה מתאים?',
    a: 'ליוצרים, אמנים, מומחים ובעלי עסקים יצירתיים שרוצים להפוך כישרון, ידע או יצירה למערכת הכנסה.',
  },
  {
    q: 'האם מובטחת הכנסה?',
    a: 'לא. אין הבטחת הכנסה ודאית. יש מסגרת, שיטה, משימות, קהילה, מדידה ותהליך ביצוע.',
  },
  {
    q: 'מה קורה אחרי הוובינר?',
    a: 'מי שירצה ויתאים יוכל לבחור מסלול כניסה לפיילוט: אמיצים או הססנים.',
  },
] as const;

export function splitHeroHeadline(headline: string): { line1: string; line2: string } {
  const parts = headline.split('.').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { line1: `${parts[0]}.`, line2: parts.slice(1).join('. ') };
  }
  return { line1: headline, line2: '' };
}
