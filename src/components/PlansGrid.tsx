import { Link } from 'react-router-dom';

export function PlansGrid() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-right">
      <h3 className="text-lg font-medium text-white mb-2">פתיחת גישה</h3>
      <p className="text-sm text-white/50 font-light leading-relaxed mb-6">
        גישה מלאה לספרייה נפתחת במסלול האמיצים או במסלול ההססנים. אותו מחיר: 8,888 ₪ לפני מע״מ.
      </p>
      <Link
        to="/pricing"
        className="inline-flex justify-center items-center min-h-11 px-6 rounded-full bg-[#C8A24C] text-black text-sm font-semibold hover:bg-[#F7E7B5]"
      >
        בחירת מסלול
      </Link>
    </div>
  );
}
