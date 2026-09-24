import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  Crown,
  FileText,
  Film,
  FolderTree,
  Gift,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Scale,
  Settings,
  Shield,
  UserCog,
  Users,
  UsersRound,
  Video,
  Wallet,
} from 'lucide-react';

export type Tab =
  | 'overview'
  | 'access'
  | 'users'
  | 'payments'
  | 'tracks'
  | 'content'
  | 'categories'
  | 'founders'
  | 'galaxy'
  | 'team'
  | 'lecturers'
  | 'premium88'
  | 'pods'
  | 'funnel'
  | 'analytics'
  | 'raffles'
  | 'leads'
  | 'webinar'
  | 'notifications'
  | 'settings'
  | 'legal'
  | 'audit'
  | 'onboarding';

export type NavItem = {
  id: Tab;
  label: string;
  /** תווית מתי־מה — מוצגת ליד השם בסיידבר */
  why?: string;
  ready: boolean;
  badge?: string;
  icon: LucideIcon;
  keywords?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'pulse',
    label: 'מבט על',
    items: [
      {
        id: 'overview',
        label: 'סקירה',
        why: '4 מדדים',
        ready: true,
        icon: LayoutDashboard,
        keywords: 'dashboard סקירה מדדים',
      },
      { id: 'notifications', label: 'התראות', ready: true, icon: Bell, keywords: 'התראות תור' },
      { id: 'analytics', label: 'אנליטיקות', ready: true, icon: BarChart3, keywords: 'analytics נתונים KPI' },
    ],
  },
  {
    id: 'people',
    label: 'אנשים והרשאות',
    items: [
      {
        id: 'access',
        label: 'גישה · הרשאות',
        why: 'דסקים ומפתחות',
        ready: true,
        icon: Shield,
        keywords: 'users roles permissions הרשאות תפקידים דסקים גישה',
      },
      {
        id: 'users',
        label: 'משתמשים',
        why: 'חשבונות',
        ready: true,
        icon: Users,
        keywords: 'users משתמשים חשבונות',
      },
      { id: 'team', label: 'צוות ומרצים', ready: true, icon: UserCog, keywords: 'team staff desk' },
      {
        id: 'founders',
        label: 'מייסדים',
        why: 'עמוד ציבורי',
        ready: true,
        icon: Crown,
        keywords: 'founders מייסדים ביו תמונה is_founder',
      },
      {
        id: 'galaxy',
        label: 'גלקסיית הצוות',
        why: 'וובינר · השפעה',
        ready: true,
        icon: UsersRound,
        keywords: 'galaxy team members impact השפעה team-universe',
      },
      { id: 'lecturers', label: 'בקשות מרצים', ready: true, icon: GraduationCap, keywords: 'lecturer בקשות' },
    ],
  },
  {
    id: 'revenue',
    label: 'מסחר והכנסות',
    items: [
      { id: 'payments', label: 'מנויים ותשלומים', ready: true, icon: Wallet, keywords: 'payments stripe' },
      {
        id: 'tracks',
        label: 'מסלולים + לידים',
        why: 'אותו אדם',
        ready: true,
        icon: Megaphone,
        keywords: 'tracks אמיצים הססנים פעימה ליד',
      },
      { id: 'premium88', label: 'נבחרת 88', ready: true, icon: UsersRound, keywords: 'premium 88' },
      {
        id: 'pods',
        label: 'פודים',
        why: 'תור קודם',
        ready: true,
        icon: Users,
        keywords: 'pods קפטן שיוך מסע',
      },
      { id: 'funnel', label: 'משפך חינמיים', ready: true, icon: BarChart3, keywords: 'funnel המרה' },
      {
        id: 'leads',
        label: 'לידים ופניות',
        why: 'CRM מאוחד',
        ready: true,
        icon: ClipboardList,
        keywords: 'leads crm',
      },
      {
        id: 'webinar',
        label: 'וובינר',
        why: 'נרשמים קודם',
        ready: true,
        icon: Video,
        keywords: 'webinar הרשמה',
      },
      { id: 'raffles', label: 'הגרלות', ready: true, icon: Gift, keywords: 'raffle הגרלה' },
    ],
  },
  {
    id: 'content',
    label: 'תוכן VOD',
    items: [
      { id: 'content', label: 'תכני VOD', ready: true, icon: Film, keywords: 'courses קורסים' },
      { id: 'categories', label: 'קטגוריות', ready: true, icon: FolderTree, keywords: 'categories' },
      { id: 'onboarding', label: 'הדרכות', ready: true, icon: BookOpen, keywords: 'onboarding הדרכה' },
    ],
  },
  {
    id: 'system',
    label: 'מערכת',
    items: [
      {
        id: 'settings',
        label: 'הגדרות',
        why: 'מוכנות',
        ready: true,
        icon: Settings,
        keywords: 'settings הגדרות מוכנות readiness',
      },
      { id: 'legal', label: 'משפטי', ready: true, icon: Scale, keywords: 'legal תקנון' },
      { id: 'audit', label: 'יומן פעולות', ready: true, icon: FileText, keywords: 'audit log' },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const TAB_META: Record<
  Tab,
  { title: string; description: string; group: string }
> = {
  overview: {
    title: 'לטיפול עכשיו',
    description: 'ארבעה מדדים לחיצים. שאר המספרים באנליטיקות — לא נמחקו.',
    group: 'מבט על',
  },
  access: {
    title: 'גישה · הרשאות',
    description: 'דסקים, תפקידים ומיילי אדמין — מפתחות לכניסה, לא רשימת חשבונות',
    group: 'אנשים והרשאות',
  },
  users: {
    title: 'משתמשים · חשבונות',
    description: 'חיפוש, עריכה והסרה של חשבונות ומנויים',
    group: 'אנשים והרשאות',
  },
  team: { title: 'צוות ומרצים', description: 'דסקים פנימיים, סטטוס גישה והודעות לצוות', group: 'אנשים והרשאות' },
  founders: {
    title: 'מייסדים · עמוד ציבורי',
    description: 'ביו ותמונה למייסד הפעיל (is_founder) — לא גלקסיית הוובינר',
    group: 'אנשים והרשאות',
  },
  galaxy: {
    title: 'גלקסיית הצוות',
    description: 'פרופילים והשפעה ב־#team-universe — נפרד מעמוד המייסדים',
    group: 'אנשים והרשאות',
  },
  lecturers: { title: 'בקשות מרצים', description: 'אישור והפעלת מרצים חדשים', group: 'אנשים והרשאות' },
  payments: { title: 'מנויים ותשלומים', description: 'חיובים, מנויים ותשלומי מסלול', group: 'מסחר והכנסות' },
  tracks: {
    title: 'מסלולים + לידים',
    description: 'אותו אדם: פעימה, ליד וכרטיס דק. הססנים 8→80→800→8,000.',
    group: 'מסחר והכנסות',
  },
  premium88: { title: 'נבחרת 88', description: 'מועמדויות ואישורי הצטרפות', group: 'מסחר והכנסות' },
  pods: {
    title: 'פודים',
    description: 'תור שיוך קודם, יצירת פוד מאחורי קיפול. מנוי ספרייה לא נכנס לתור.',
    group: 'מסחר והכנסות',
  },
  funnel: { title: 'משפך חינמיים', description: 'המרות ממשתמשים חינמיים', group: 'מסחר והכנסות' },
  leads: {
    title: 'לידים ופניות',
    description: 'CRM מאוחד מכל המקורות. למסלול+פעימה — לשונית מסלולים.',
    group: 'מסחר והכנסות',
  },
  webinar: {
    title: 'וובינר',
    description: 'נרשמים קודם; הגדרות מאחורי קיפול',
    group: 'מסחר והכנסות',
  },
  raffles: { title: 'הגרלות', description: 'כרטיסים, תקנון וזוכים', group: 'מסחר והכנסות' },
  content: { title: 'תכני VOD', description: 'כרזות ופסים אקדמיים, קורסים, פרקים והעלאות', group: 'תוכן VOD' },
  categories: { title: 'קטגוריות', description: 'סדר ותצוגה בספרייה', group: 'תוכן VOD' },
  onboarding: { title: 'הדרכות', description: 'מרכז הדרכה לצוות', group: 'תוכן VOD' },
  notifications: { title: 'התראות', description: 'תור פעולות לטיפול', group: 'מבט על' },
  analytics: {
    title: 'אנליטיקות',
    description: 'כל מדדי ה־KPI, אירועים, וידאו ומשפך',
    group: 'מבט על',
  },
  settings: {
    title: 'הגדרות · מוכנות',
    description: 'אינטגרציות וצ׳ק־ליסט השקה — לא ניהול תוכן',
    group: 'מערכת',
  },
  legal: { title: 'משפטי', description: 'תקנון, פרטיות והגרלות', group: 'מערכת' },
  audit: { title: 'יומן פעולות', description: 'היסטוריית שינויים באדמין', group: 'מערכת' },
};
