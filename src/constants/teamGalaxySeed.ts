/** Public/admin seed for the webinar team slide. Hebrew is canonical. */

export type TeamGroup = 'founder' | 'leadership' | 'core' | 'contributor' | 'ecosystem';
export type VisualTier = 'hero' | 'large' | 'medium' | 'small';
export type PublishStatus = 'draft' | 'published' | 'hidden';

export interface TeamGalaxySeedMember {
  id: string;
  slug: string;
  name_he: string;
  name_en: string;
  role_he: string;
  role_en: string;
  photo: string;
  photo_alt: string;
  quote: string;
  bio: string;
  contribution: string;
  vision: string;
  closing_quote: string;
  responsibilities: string[];
  expertise: string[];
  impact_score: number;
  group_key: TeamGroup;
  visual_tier: VisualTier;
  featured: boolean;
  status: PublishStatus;
  display_order: number;
}

export interface TeamSectionSettings {
  title_he: string;
  title_en: string;
  subtitle_he: string;
  subtitle_en: string;
  ecosystem_label_he: string;
  ecosystem_label_en: string;
  mobile_hint: string;
  show_all_label: string;
  show_impact: boolean;
  show_quotes: boolean;
  show_expertise: boolean;
  show_links: boolean;
  published: boolean;
  group_order: TeamGroup[];
  background_url: string;
  overlay_opacity: number;
}

export const TEAM_SECTION_DEFAULTS: TeamSectionSettings = {
  title_he: 'האנשים שמאחורי החזון',
  title_en: 'The People Behind the Vision',
  subtitle_he: 'כל אחד מביא כוח אחר. יחד הם יוצרים מערכת אחת.',
  subtitle_en: 'Different strengths. One system. Infinite impact.',
  ecosystem_label_he: 'האקוסיסטם שלנו',
  ecosystem_label_en: 'Our ecosystem',
  mobile_hint: 'החליקו או הקישו לפתיחת פרופיל',
  show_all_label: 'הצגת כל הצוות',
  show_impact: true,
  show_quotes: true,
  show_expertise: true,
  show_links: false,
  published: true,
  group_order: ['founder', 'leadership', 'core', 'contributor', 'ecosystem'],
  background_url: '',
  overlay_opacity: 0.35,
};

export const TEAM_ECOSYSTEM = [
  { id: 'eco-creators', label_he: 'יוצרים', label_en: 'Creators' },
  { id: 'eco-designers', label_he: 'מעצבים', label_en: 'Designers' },
  { id: 'eco-engineers', label_he: 'מהנדסים', label_en: 'Engineers' },
  { id: 'eco-thinkers', label_he: 'הוגים', label_en: 'Thinkers' },
  { id: 'eco-community', label_he: 'קהילה', label_en: 'Community' },
  { id: 'eco-partners', label_he: 'שותפים', label_en: 'Partners' },
] as const;

function person(
  partial: Omit<TeamGalaxySeedMember, 'quote' | 'vision' | 'closing_quote' | 'photo_alt' | 'status'> & {
    quote?: string;
    vision?: string;
    closing_quote?: string;
    photo_alt?: string;
    status?: PublishStatus;
  },
): TeamGalaxySeedMember {
  return {
    quote: '',
    vision: '',
    closing_quote: '',
    photo_alt: partial.photo ? `${partial.name_he}, ${partial.role_he}` : '',
    status: 'published',
    ...partial,
  };
}

export const TEAM_GALAXY_SEED: TeamGalaxySeedMember[] = [
  person({
    id: 'tm-gal',
    slug: 'gal-abramovitz',
    name_he: 'גל אברמוביץ',
    name_en: 'Gal Abramovitz',
    role_he: 'מייסד וחזון',
    role_en: 'Founder & Visionary',
    photo: '/team/gal.png',
    photo_alt: 'גל אברמוביץ, מייסד Infinite Masterpiece',
    quote: 'הפיכת פוטנציאל יצירתי להשפעה בעולם האמיתי.',
    bio: 'מוביל את החזון, השפה, התוכן והמבנה העסקי של Infinite Masterpiece.',
    contribution: 'מגדיר כיוון, מחבר נקודות ומאחד צוות סביב מטרה גדולה יותר.',
    vision: 'עולם שבו יוצרים ויזמים חזוניים משגשגים — כלכלית, אישית ויצירתית.',
    closing_quote: 'אנשים לא בונים דברים גדולים לבד. הם בונים אותם עם האנשים הנכונים.',
    responsibilities: ['חזון ואסטרטגיה', 'פיתוח עסקי', 'מיתוג', 'בניית צוות'],
    expertise: ['חזון', 'אסטרטגיה', 'מיתוג'],
    impact_score: 100,
    group_key: 'founder',
    visual_tier: 'hero',
    featured: true,
    display_order: 0,
  }),
  person({
    id: 'tm-tami',
    slug: 'tami-elian',
    name_he: 'תמי אליאן',
    name_en: 'Tami Elian',
    role_he: 'סמנכ״לית טכנולוגיה',
    role_en: 'CTO',
    photo: '/team/tami.png',
    bio: 'מובילה את הצד הטכנולוגי, המוצרי וה־UX.',
    contribution: 'הופכת חזון למוצר שעובד — מחוויית משתמש עד ארכיטקטורה.',
    responsibilities: ['מוצר וטכנולוגיה', 'UX', 'ארכיטקטורה', 'מדידה'],
    expertise: ['מוצר', 'טכנולוגיה', 'UX'],
    impact_score: 90,
    group_key: 'leadership',
    visual_tier: 'large',
    featured: true,
    display_order: 1,
  }),
  person({
    id: 'tm-gleb',
    slug: 'gleb-smirnov',
    name_he: 'גלב סמירנוב',
    name_en: 'Gleb Smirnov',
    role_he: 'קריאייטיב ומותג',
    role_en: 'CCO',
    photo: '/team/gleb.png',
    bio: 'מוביל את שכבת הקריאייטיב, השפה הוויזואלית, התוכן והמותג.',
    contribution: 'אחראי על הזהות הוויזואלית וחוויית המותג בכל נקודות המגע.',
    responsibilities: ['קריאייטיב', 'שפה ויזואלית', 'תוכן', 'מותג'],
    expertise: ['קריאייטיב', 'עיצוב', 'מיתוג'],
    impact_score: 88,
    group_key: 'leadership',
    visual_tier: 'large',
    featured: true,
    display_order: 2,
  }),
  person({
    id: 'tm-eran',
    slug: 'eran-levi',
    name_he: 'ערן לוי',
    name_en: 'Eran Levi',
    role_he: 'ראש תפעול',
    role_en: 'Head of Operations',
    photo: '',
    bio: 'מוביל את התפעול היומיומי ומחבר בין האסטרטגיה לביצוע.',
    contribution: 'בונה תהליכים יציבים שמאפשרים לצוות לזוז מהר בלי לאבד דיוק.',
    responsibilities: ['תפעול', 'תהליכים', 'תיאום בין צוותים'],
    expertise: ['תפעול', 'ניהול'],
    impact_score: 72,
    group_key: 'leadership',
    visual_tier: 'large',
    featured: false,
    display_order: 3,
  }),
  person({
    id: 'tm-liat',
    slug: 'liat-shachar',
    name_he: 'ליאת שחר',
    name_en: 'Liat Shachar',
    role_he: 'ראש עיצוב',
    role_en: 'Head of Design',
    photo: '',
    bio: 'מובילה את מערכת העיצוב והחוויה הוויזואלית.',
    contribution: 'שומרת על עקביות עיצובית ו־UX בכל נקודות המגע.',
    responsibilities: ['מערכת עיצוב', 'UX', 'עקביות ויזואלית'],
    expertise: ['עיצוב', 'UX'],
    impact_score: 65,
    group_key: 'core',
    visual_tier: 'medium',
    featured: false,
    display_order: 4,
  }),
  person({
    id: 'tm-maya',
    slug: 'maya-bar',
    name_he: 'מאיה בר',
    name_en: 'Maya Bar',
    role_he: 'שיווק',
    role_en: 'Marketing',
    photo: '',
    bio: 'מובילה את השיווק והמסר לקהלים חדשים.',
    contribution: 'מתרגמת את החזון לשפה שמגיעה לאנשים הנכונים.',
    responsibilities: ['שיווק', 'קמפיינים', 'מסר'],
    expertise: ['שיווק', 'דיגיטל'],
    impact_score: 62,
    group_key: 'core',
    visual_tier: 'medium',
    featured: false,
    display_order: 5,
  }),
  person({
    id: 'tm-noam',
    slug: 'noam-cohen',
    name_he: 'נועם כהן',
    name_en: 'Noam Cohen',
    role_he: 'מוצר',
    role_en: 'Product',
    photo: '',
    bio: 'מדייק את חוויית המוצר ואת מסע המשתמש.',
    contribution: 'שומר שהמערכת תישאר פשוטה למשתמש וחזקה מאחורי הקלעים.',
    responsibilities: ['מוצר', 'מסעות משתמש', 'עדיפויות'],
    expertise: ['מוצר'],
    impact_score: 58,
    group_key: 'core',
    visual_tier: 'medium',
    featured: false,
    display_order: 6,
  }),
  person({
    id: 'tm-ido',
    slug: 'ido-shalev',
    name_he: 'עידו שלו',
    name_en: 'Ido Shalev',
    role_he: 'עיצוב',
    role_en: 'Design',
    photo: '',
    bio: 'מעצב את השפה הוויזואלית של Infinite Masterpiece.',
    contribution: 'שומר על יוקרה, דיוק ועקביות בכל נקודת מגע.',
    responsibilities: ['עיצוב', 'שפה ויזואלית'],
    expertise: ['עיצוב'],
    impact_score: 54,
    group_key: 'core',
    visual_tier: 'medium',
    featured: false,
    display_order: 7,
  }),
  person({
    id: 'tm-shani',
    slug: 'shani-rosen',
    name_he: 'שני רוזן',
    name_en: 'Shani Rosen',
    role_he: 'קהילה',
    role_en: 'Community',
    photo: '',
    bio: 'מובילה את הקהילה ומחברת בין יוצרים.',
    contribution: 'בונה שיח ושיתוף פעולה שמחזיקים את התנועה לאורך זמן.',
    responsibilities: ['קהילה', 'שיח', 'חיבורים'],
    expertise: ['קהילה'],
    impact_score: 56,
    group_key: 'core',
    visual_tier: 'medium',
    featured: false,
    display_order: 8,
  }),
  person({
    id: 'tm-shira',
    slug: 'shira-tal',
    name_he: 'שירה טל',
    name_en: 'Shira Tal',
    role_he: 'שיווק מוביל',
    role_en: 'Marketing Lead',
    photo: '',
    bio: 'מובילה את השיווק וההסעה של המיזם.',
    contribution: 'אחראית על אסטרטגיית שיווק, קמפיינים והגעה לקהלים חדשים.',
    responsibilities: ['שיווק', 'קמפיינים', 'הסעה'],
    expertise: ['שיווק', 'דיגיטל'],
    impact_score: 50,
    group_key: 'core',
    visual_tier: 'medium',
    featured: false,
    display_order: 9,
  }),
  person({
    id: 'tm-dana',
    slug: 'dana-koren',
    name_he: 'דנה קורן',
    name_en: 'Dana Koren',
    role_he: 'אסטרטגיית תוכן',
    role_en: 'Content Strategist',
    photo: '',
    bio: 'אחראית על אסטרטגיית התוכן והפצה.',
    contribution: 'מבנה את מסלולי התוכן ומוודאת שכל יצירה מגיעה לקהל הנכון.',
    responsibilities: ['אסטרטגיית תוכן', 'הפצה', 'מדידה'],
    expertise: ['תוכן', 'אסטרטגיה'],
    impact_score: 60,
    group_key: 'core',
    visual_tier: 'small',
    featured: false,
    display_order: 10,
  }),
  person({
    id: 'tm-yonatan',
    slug: 'yonatan-amalay',
    name_he: 'יונתן עמלי',
    name_en: 'Yonatan Amalay',
    role_he: 'מוביל טכנולוגיה',
    role_en: 'Tech Lead',
    photo: '',
    bio: 'מוביל את הפיתוח הטכני והתשתיות.',
    contribution: 'אחראי על יציבות המערכת, ביצועים וחדשנות טכנולוגית.',
    responsibilities: ['פיתוח', 'תשתיות', 'ביצועים'],
    expertise: ['פיתוח', 'תשתיות'],
    impact_score: 55,
    group_key: 'core',
    visual_tier: 'small',
    featured: false,
    display_order: 11,
  }),
  person({
    id: 'tm-creators',
    slug: 'creators',
    name_he: 'יוצרים',
    name_en: 'Creators',
    role_he: 'הפקת תוכן',
    role_en: 'Content Creators',
    photo: '',
    bio: 'צוות יוצרים המפיק תוכן מקצועי לפלטפורמה.',
    contribution: 'יוצרים ומפיקים תוכן וידאו, כתיבה ועיצוב לכל ערוצי המיזם.',
    responsibilities: ['הפקת תוכן', 'וידאו', 'כתיבה'],
    expertise: ['יצירה', 'הפקה'],
    impact_score: 40,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 12,
  }),
  person({
    id: 'tm-designers',
    slug: 'designers',
    name_he: 'מעצבים',
    name_en: 'Designers',
    role_he: 'צוות עיצוב',
    role_en: 'Design Team',
    photo: '',
    bio: 'צוות מעצבים האחראי על הוויזואליה בכל הפלטפורמה.',
    contribution: 'מעצבים חוויות, ממשקים ותוכן ויזואלי איכותי.',
    responsibilities: ['עיצוב ממשק', 'גרפיקה'],
    expertise: ['עיצוב'],
    impact_score: 35,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 13,
  }),
  person({
    id: 'tm-engineers',
    slug: 'engineers',
    name_he: 'מהנדסים',
    name_en: 'Engineers',
    role_he: 'פיתוח',
    role_en: 'Engineering',
    photo: '',
    bio: 'צוות הפיתוח שבונה את התשתיות והמוצר.',
    contribution: 'מחזיק את המערכת יציבה, מהירה ומוכנה לצמיחה.',
    responsibilities: ['פיתוח', 'תשתיות'],
    expertise: ['הנדסה'],
    impact_score: 38,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 14,
  }),
  person({
    id: 'tm-thinkers',
    slug: 'thinkers',
    name_he: 'הוגים',
    name_en: 'Thinkers',
    role_he: 'חשיבה אסטרטגית',
    role_en: 'Strategic Thinkers',
    photo: '',
    bio: 'שכבת חשיבה שמחדדת כיוון, שפה והחלטות.',
    contribution: 'מביאים עומק, דיוק ופרספקטיבה לקבלת החלטות.',
    responsibilities: ['חשיבה', 'ייעוץ'],
    expertise: ['אסטרטגיה'],
    impact_score: 36,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 15,
  }),
  person({
    id: 'tm-ambassadors',
    slug: 'ambassadors',
    name_he: 'שגרירים',
    name_en: 'Ambassadors',
    role_he: 'שגרירי מותג',
    role_en: 'Brand Ambassadors',
    photo: '',
    bio: 'שגרירי המותג שמרחיבים את ההשפעה.',
    contribution: 'מייצגים את Infinite Masterpiece ומביאים קהלים חדשים.',
    responsibilities: ['ייצוג המותג', 'הרחבת השפעה'],
    expertise: ['קהילה'],
    impact_score: 35,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 16,
  }),
  person({
    id: 'tm-community',
    slug: 'community-leads',
    name_he: 'קהילה',
    name_en: 'Community',
    role_he: 'הובלת קהילה',
    role_en: 'Community Leads',
    photo: '',
    bio: 'מובילי הקהילה שמחזיקים שיח, קצב וחיבורים.',
    contribution: 'שומרים שהקהילה תישאר חיה, פעילה ומחוברת לביצוע.',
    responsibilities: ['קהילה', 'הנחיה'],
    expertise: ['קהילה'],
    impact_score: 34,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 17,
  }),
  person({
    id: 'tm-legal',
    slug: 'legal',
    name_he: 'משפט',
    name_en: 'Legal',
    role_he: 'ייעוץ משפטי',
    role_en: 'Legal & Compliance',
    photo: '',
    bio: 'צוות משפטי האחראי על תקנונים, פרטיות והיבטים משפטיים.',
    contribution: 'מבטיח עמידה ברגולציה, תקנונים והגנת מידע.',
    responsibilities: ['תקנונים', 'פרטיות'],
    expertise: ['משפט'],
    impact_score: 30,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 18,
  }),
  person({
    id: 'tm-finance',
    slug: 'finance',
    name_he: 'פיננסים',
    name_en: 'Finance',
    role_he: 'כספים ותפעול',
    role_en: 'Finance & Operations',
    photo: '',
    bio: 'צוות פיננסי האחראי על ניהול תקציב ותזרים.',
    contribution: 'מנהל את ההיבטים הפיננסיים ומבטיח יציבות עסקית.',
    responsibilities: ['תקציב', 'תזרים'],
    expertise: ['פיננסים'],
    impact_score: 30,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 19,
  }),
  person({
    id: 'tm-hr',
    slug: 'hr',
    name_he: 'משאבי אנוש',
    name_en: 'HR',
    role_he: 'גיוס וליווי צוות',
    role_en: 'Human Resources',
    photo: '',
    bio: 'צוות משאבי אנוש האחראי על גיוס וניהול צוות.',
    contribution: 'מגייס, מלווה ומפתח את הצוות האנושי של המיזם.',
    responsibilities: ['גיוס', 'פיתוח צוות'],
    expertise: ['משאבי אנוש'],
    impact_score: 25,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 20,
  }),
  person({
    id: 'tm-partners',
    slug: 'partners',
    name_he: 'שותפים',
    name_en: 'Partners',
    role_he: 'שותפים אסטרטגיים',
    role_en: 'Strategic Partners',
    photo: '',
    bio: 'שותפים אסטרטגיים שמרחיבים את יכולות המערכת.',
    contribution: 'מחברים יכולות, קהלים ותשתיות שמחזקים את המיזם.',
    responsibilities: ['שותפויות', 'חיבורים'],
    expertise: ['שותפויות'],
    impact_score: 32,
    group_key: 'contributor',
    visual_tier: 'small',
    featured: false,
    display_order: 21,
  }),
];


export function localizedName(m: { name_he?: string; name_en?: string; name?: string }, locale: 'he' | 'en' = 'he') {
  if (locale === 'en') return m.name_en || m.name_he || m.name || '';
  return m.name_he || m.name_en || m.name || '';
}

export function localizedRole(m: { role_he?: string; role_en?: string; role?: string }, locale: 'he' | 'en' = 'he') {
  if (locale === 'en') return m.role_en || m.role_he || m.role || '';
  return m.role_he || m.role_en || m.role || '';
}

export function teamGalaxyPublicMembers() {
  return TEAM_GALAXY_SEED.filter((m) => m.status === 'published').map((m) => ({
    ...m,
    name: m.name_he,
    role: m.role_en,
    hierarchy_level:
      m.group_key === 'founder'
        ? 'founder'
        : m.group_key === 'leadership'
          ? 'leadership'
          : m.group_key === 'contributor'
            ? 'contributor'
            : 'core',
    orbit: m.group_key === 'founder' ? 0 : m.group_key === 'leadership' ? 1 : m.group_key === 'contributor' ? 3 : 2,
    active: true,
  }));
}
