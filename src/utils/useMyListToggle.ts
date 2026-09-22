import { useApp } from '../context/AppContext';
import { usePaywall } from '../context/PaywallContext';
import { useToast } from '../context/ToastContext';
import { canAddToList, shouldPromptSavePaywall } from './access';

export function useMyListToggle() {
  const { toggleMyList, isInMyList, myList, user } = useApp();
  const { openPaywall } = usePaywall();
  const { showToast } = useToast();

  return (courseId: string) => {
    const adding = !isInMyList(courseId);
    if (adding && !canAddToList(user, myList.length)) {
      openPaywall('save_limit');
      return;
    }
    toggleMyList(courseId);
    if (adding && shouldPromptSavePaywall(user)) {
      showToast('נשמר ברשימה. עם מנוי ספרייה אפשר לשמור בלי הגבלה.', 'success');
    }
  };
}
