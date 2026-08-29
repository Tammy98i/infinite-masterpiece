const PREVIEW_PASSWORD = 'Masterpiece88';

type PreviewUser = {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  subscriptionPlan: 'free_trial' | 'monthly' | 'annual' | 'premium_88' | 'none';
  interests: string[];
  avatar: string;
  isFounder: boolean;
  staffDesk: string;
  staffStatus: 'active' | 'suspended' | 'limited';
};

const STAFF: PreviewUser[] = [
  {
    id: 'user-admin-local',
    email: 'admin@infinitemasterpiece.local',
    name: 'מנהלת המערכת',
    role: 'admin',
    subscriptionPlan: 'premium_88',
    interests: [],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isFounder: false,
    staffDesk: '',
    staffStatus: 'active',
  },
];

export function previewLogin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = STAFF.find((item) => item.email === normalized);
  if (!user || password !== PREVIEW_PASSWORD) {
    throw new Error('אימייל או סיסמה שגויים');
  }
  return { token: `preview:${user.id}`, user };
}
