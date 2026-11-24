export function canOpenCommunity(user: {
  id?: string;
  role?: string;
  subscriptionPlan?: string;
  isFounder?: boolean;
}) {
  if (!user?.id || user.id === 'guest') return false;
  if (user.role === 'admin' || user.role === 'instructor' || user.isFounder) return true;
  return ['free_trial', 'monthly', 'annual', 'premium_88'].includes(user.subscriptionPlan || '');
}
