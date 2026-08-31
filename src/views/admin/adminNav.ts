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
  | 'team'
  | 'lecturers'
  | 'premium88'
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
      { id: 'overview', label: 'סקירה', ready: true, icon: LayoutDashboard, keywords: 'dashboard סקירה' },
      { id: 'notifications', label: 'התראות', ready: true, icon: Bell, keywords: 'התראות תור' },
      { id: 'analytics', label: 'אנליטיקות', ready: true, icon: BarChart3, keywords: 'analytics נתונים' },
    ],
  },
  {
    id: 'people',
    label: 'אנשים והרשאות',
    items: [
      {
        id: 'access',
        label: 'משתמשים · תפקידים · הרשאות',
        ready: true,
        icon: Shield,
        badge: 'חדש',
        keywords: 'users roles permissions הרשאות תפקידים',
      },
      { id: 'users', label: 'משתמשים', ready: true, icon: Users, keywords: 'users משתמשים' },
      { id: 'team', label: 'צוות ומרצים', ready: true, icon: UserCog, badge: 'חדש', keywords: 'team staff desk' },
      { id: 'founders', label: 'צוות מייסדים', ready: true, icon: Crown, keywords: 'founders מייסדים' },
      { id: 'lecturers', label: 'בקשות מרצים', ready: true, icon: GraduationCap, keywords: 'lecturer בקשות' },
    ],
  },
  {
    id: 'revenue',
    label: 'מסחר והכנסות',
    items: [
      { id: 'payments', label: 'מנויים ותשלומים', ready: true, icon: Wallet, keywords: 'payments stripe' },
      { id: 'tracks', label: 'מסלולי כניסה', ready: true, icon: Megaphone, badge: 'חדש', keywords: 'tracks אמיצים הססנים' },
      { id: 'premium88', label: 'נבחרת 88', ready: true, icon: UsersRound, keywords: 'premium 88' },
      { id: 'funnel', label: 'משפך חינמיים', ready: true, icon: BarChart3, keywords: 'funnel המרה' },
      { id: 'leads', label: 'לידים ופניות', ready: true, icon: ClipboardList, keywords: 'leads crm' },
      { id: 'webinar', label: 'וובינר', ready: true, icon: Video, badge: 'חדש', keywords: 'webinar הרשמה' },
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
      { id: 'settings', label: 'הגדרות', ready: true, icon: Settings, keywords: 'settings הגדרות' },
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
  overview: { title: 'סקירה', description: 'מצב המערכת, מוכנות להשקה ומדדים', group: 'מבט על' },
  access: {
    title: 'משתמשים · תפקידים · הרשאות',
    description: 'ניהול חשבונות, תפקידים, דסקים ומיילי אדמין — במקום אחד',
    group: 'אנשים והרשאות',
  },
  users: { title: 'משתמשים', description: 'רשימת משתמשים, מנויים ושיוך לצוות', group: 'אנשים והרשאות' },
  team: { title: 'צוות ומרצים', description: 'דסקים פנימיים, סטטוס גישה והודעות לצוות', group: 'אנשים והרשאות' },
  founders: { title: 'צוות מייסדים', description: 'תמונות, ביו וקישורים בעמוד הציבורי', group: 'אנשים והרשאות' },
  lecturers: { title: 'בקשות מרצים', description: 'אישור והפעלת מרצים חדשים', group: 'אנשים והרשאות' },
  payments: { title: 'מנויים ותשלומים', description: 'חיובים, מנויים ותשלומי מסלול', group: 'מסחר והכנסות' },
  tracks: { title: 'מסלולי כניסה', description: 'אמיצים, הססנים ומעקב תשלומים', group: 'מסחר והכנסות' },
  premium88: { title: 'נבחרת 88', description: 'מועמדויות ואישורי הצטרפות', group: 'מסחר והכנסות' },
  funnel: { title: 'משפך חינמיים', description: 'המרות ממשתמשים חינמיים', group: 'מסחר והכנסות' },
  leads: { title: 'לידים ופניות', description: 'CRM ופניות מהאתר', group: 'מסחר והכנסות' },
  webinar: { title: 'וובינר', description: 'הגדרות, הרשמות ומדדים', group: 'מסחר והכנסות' },
  raffles: { title: 'הגרלות', description: 'כרטיסים, תקנון וזוכים', group: 'מסחר והכנסות' },
  content: { title: 'תכני VOD', description: 'קורסים, פרקים והעלאות', group: 'תוכן VOD' },
  categories: { title: 'קטגוריות', description: 'סדר ותצוגה בספרייה', group: 'תוכן VOD' },
  onboarding: { title: 'הדרכות', description: 'מרכז הדרכה לצוות', group: 'תוכן VOD' },
  notifications: { title: 'התראות', description: 'תור פעולות לטיפול', group: 'מבט על' },
  analytics: { title: 'אנליטיקות', description: 'אירועים, וידאו ומשפך', group: 'מבט על' },
  settings: { title: 'הגדרות', description: 'מוכנות מערכת ואינטגרציות', group: 'מערכת' },
  legal: { title: 'משפטי', description: 'תקנון, פרטיות והגרלות', group: 'מערכת' },
  audit: { title: 'יומן פעולות', description: 'היסטוריית שינויים באדמין', group: 'מערכת' },
};
