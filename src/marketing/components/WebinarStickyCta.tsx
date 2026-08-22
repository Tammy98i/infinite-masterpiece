import { useEffect, useState } from 'react';
import { trackWebinarCta, scrollToWebinarForm } from '../../utils/analytics';

export function WebinarStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById('webinar-register-hero');
    if (!target) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisible(!entries.some((entry) => entry.isIntersecting));
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#C8A24C]/20 bg-[#010308]/95 backdrop-blur-xl px-4 py-3">
      <button
        type="button"
        onClick={() => {
          trackWebinarCta('sticky');
          scrollToWebinarForm();
        }}
        className="block w-full text-center py-3 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black text-sm font-semibold min-h-11"
      >
        הרשמה לוובינר
      </button>
    </div>
  );
}
