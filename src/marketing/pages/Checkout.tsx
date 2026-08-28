import { useEffect, useState } from 'react';
import { EntryTrackCards } from '../components/EntryTrackCards';
import { checkoutApi } from '../../api/checkout';

export function Checkout() {
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);

  useEffect(() => {
    checkoutApi
      .status()
      .then((res) => setCheckoutEnabled(res.enabled))
      .catch(() => setCheckoutEnabled(false));
  }, []);

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#C8A24C] mb-4 font-semibold">
            בחירת מסלול
          </p>
          <h1 className="text-3xl md:text-4xl font-heading text-white mb-4">
            בחרו איך להיכנס
          </h1>
          <p className="text-sm text-white/45 font-light leading-relaxed max-w-xl mx-auto">
            {checkoutEnabled
              ? 'אחרי בחירת המסלול ומילוי הפרטים תועברו לתשלום מאובטח דרך Stripe.'
              : 'החיוב בכרטיס ייפתח כשמפתחות Stripe יוגדרו. כרגע בוחרים מסלול והפרטים נקלטים מול הצוות.'}
          </p>
        </div>
        <EntryTrackCards />
      </div>
    </div>
  );
}
