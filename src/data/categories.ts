import type { AccessLevel, Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'cat-sales',
    name: 'מכירות והכנסה',
    description: 'סגירה, הצעה, מחיר והפיכת שיחה להכנסה.',
    icon: 'TrendingUp',
    sortOrder: 1,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal'],
  },
  {
    id: 'cat-marketing',
    name: 'שיווק ומיתוג',
    description: 'מיצוב, שפה והפצה שמביאים את האנשים הנכונים.',
    icon: 'Megaphone',
    sortOrder: 2,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal'],
  },
  {
    id: 'cat-story',
    name: 'תוכן וסטוריטלינג',
    description: 'סיפור, במה ותוכן שגורמים לאנשים להישאר.',
    icon: 'BookOpen',
    sortOrder: 3,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal'],
  },
  {
    id: 'cat-product',
    name: 'מוצר ומודל עסקי',
    description: 'הצעה, מודל ומערכת שמחזיקים את העסק.',
    icon: 'Boxes',
    sortOrder: 4,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal', 'inst-tami'],
  },
  {
    id: 'cat-tech',
    name: 'טכנולוגיה ומערכות',
    description: 'תשתית, כלים וזרימות עבודה שמריצות את המערכת.',
    icon: 'Cpu',
    sortOrder: 5,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-tami'],
  },
  {
    id: 'cat-ai',
    name: 'AI ואוטומציה',
    description: 'בינה מלאכותית ותהליכים שחוסכים זמן ומדייקים עבודה.',
    icon: 'Sparkles',
    sortOrder: 6,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-tami'],
  },
  {
    id: 'cat-community',
    name: 'קהילה וניהול קהל',
    description: 'קהילה, קהל ויחסים שמחזיקים תנועה לאורך זמן.',
    icon: 'Users',
    sortOrder: 7,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal'],
  },
  {
    id: 'cat-mindset',
    name: 'תודעה, חוסן והתפתחות אישית',
    description: 'חוסן, מיקוד והתפתחות שמחזיקים יוצר לאורך הדרך.',
    icon: 'Brain',
    sortOrder: 8,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal'],
  },
  {
    id: 'cat-finance',
    name: 'פיננסים וניהול כסף',
    description: 'כסף, תזרים והחלטות שמגינות על העסק ועל החופש.',
    icon: 'Wallet',
    sortOrder: 9,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal'],
  },
  {
    id: 'cat-88',
    name: 'נבחרת 88',
    description: 'שכבת העומק. תכנים למי שנמצא בנבחרת.',
    icon: 'Infinity',
    sortOrder: 10,
    accessLevel: 'premium_88',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal', 'inst-tami'],
  },
  {
    id: 'cat-founders',
    name: 'צוות המיזם',
    description: 'הידע של מי שעומד מאחורי המערכת.',
    icon: 'Award',
    sortOrder: 11,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal', 'inst-tami'],
  },
  {
    id: 'cat-guests',
    name: 'הרצאות אורחים',
    description: 'מרצים אורחים שמביאים זווית נוספת לספרייה.',
    icon: 'Mic',
    sortOrder: 12,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: [],
  },
  {
    id: 'cat-shorts',
    name: '10 דקות',
    description: 'הרצאות קצרות למי שיש עכשיו רק כמה דקות.',
    icon: 'Timer',
    sortOrder: 13,
    accessLevel: 'free',
    coverImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-tami'],
  },
  {
    id: 'cat-paths',
    name: 'מסלולי עומק',
    description: 'רצף למידה מסודר, לא הרצאה בודדת.',
    icon: 'Route',
    sortOrder: 14,
    accessLevel: 'premium',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    leadInstructorIds: ['inst-gal', 'inst-tami'],
  },
];

export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'cat-psychology': 'cat-mindset',
  'cat-relationships': 'cat-mindset',
  'cat-business': 'cat-sales',
  'cat-mindfulness': 'cat-mindset',
  'cat-parenting': 'cat-mindset',
  'cat-health': 'cat-mindset',
  'cat-money': 'cat-finance',
  'cat-skills': 'cat-story',
};

export const COURSE_CATEGORY_OVERRIDES: Record<string, string> = {
  'course-gal-system': 'cat-founders',
  'course-tami-product': 'cat-founders',
  'course-startup-accelerator': 'cat-sales',
};

export const INTEREST_OPTIONS = CATEGORIES.filter(
  (c) => !['cat-shorts', 'cat-paths', 'cat-88'].includes(c.id)
).map((c) => c.name);

export const INTEREST_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c.id])
);

export function categoryAccess(cat: Pick<Category, 'accessLevel'> | undefined): AccessLevel {
  return cat?.accessLevel || 'premium';
}
