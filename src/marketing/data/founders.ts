export interface FounderPortfolioItem {
  title: string;
  summary: string;
}

export interface Founder {
  id: string;
  name: string;
  title: string;
  blurb: string;
  description: string;
  image: string;
  featured?: boolean;
  expertise: string[];
  leadCategoryIds: string[];
  portfolio: FounderPortfolioItem[];
}

export const FOUNDERS: Founder[] = [
  {
    id: 'gal',
    name: 'גל אברמוביץ׳',
    title: 'חזון ומבנה עסקי',
    blurb: 'מוביל את החזון, השפה והמבנה העסקי של Infinite Masterpiece.',
    description:
      'מוביל את החזון, השפה, התוכן והמבנה העסקי של Infinite Masterpiece.\n\nאחראי להפוך רעיון ממסע השראה למערכת ביצוע, קהילה ותנועה, ולתרגם פוטנציאל יצירתי לתוצאות מדויקות.',
    image: '/team/gal.png',
    featured: true,
    expertise: ['חזון', 'מבנה עסקי', 'שפה ותוכן'],
    leadCategoryIds: ['cat-sales', 'cat-marketing', 'cat-story', 'cat-product', 'cat-88', 'cat-founders'],
    portfolio: [
      {
        title: 'Infinite Masterpiece',
        summary: 'מערכת, קהילה ומבנה עסקי סביב יצירה.',
      },
      {
        title: 'ספריית אינסוף',
        summary: 'תוכן והפצה ליוצרים ולנבחרת.',
      },
    ],
  },
  {
    id: 'tami',
    name: 'תמי אליאן',
    title: 'מוצר וטכנולוגיה',
    blurb: 'מובילה את המוצר, הטכנולוגיה וה־UX. הופכת חזון למערכת שעובדת.',
    description:
      'מובילה את הצד הטכנולוגי, המוצרי וה־UX.\n\nאחראית על האתר, ספריית ה־VOD, מדידה, CRM ואוטומציה, והופכת חזון למוצר שעובד.',
    image: '/team/tami.png',
    featured: true,
    expertise: ['מוצר', 'טכנולוגיה', 'UX'],
    leadCategoryIds: ['cat-product', 'cat-tech', 'cat-ai', 'cat-founders'],
    portfolio: [
      {
        title: 'ספריית VOD',
        summary: 'מוצר, חוויית שימוש וארכיטקטורה.',
      },
      {
        title: 'האתר והמערכת',
        summary: 'מדידה, CRM ואוטומציה שמחזיקים את התנועה.',
      },
    ],
  },
];

export const featuredFounders = FOUNDERS.filter((f) => f.featured);
export const rosterFounders = FOUNDERS.filter((f) => !f.featured);

export function getFounderById(id: string) {
  return FOUNDERS.find((f) => f.id === id);
}

export function instructorToFounder(instructor: {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  bio: string;
  credentials: string[];
  founderId?: string;
}): Founder {
  const bio = instructor.bio.trim();
  return {
    id: instructor.founderId || instructor.id,
    name: instructor.name,
    title: instructor.title,
    blurb: bio.split(/\n\n+/)[0] || instructor.title,
    description: bio,
    image: instructor.avatarUrl,
    featured: false,
    expertise: instructor.credentials || [],
    leadCategoryIds: [],
    portfolio: [],
  };
}
