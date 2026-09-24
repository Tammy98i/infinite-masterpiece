import { BarChart3, Megaphone, Settings, Target } from 'lucide-react';
const HIGHLIGHTS = [
  { days: 'ימים 1–8', title: 'מכירות והשפעה', text: 'הצגת ערך, שיחת מכירה, משא ומתן וסגירת עסקאות.', icon: Target },
  { days: 'ימים 9–16', title: 'שיווק ובידול', text: 'מיתוג, מסרים, תוכן ונוכחות שמושכת לקוחות.', icon: Megaphone },
  { days: 'ימים 17–24', title: 'מודל ותשתיות', text: 'מוצר, תמחור, CRM ותהליכי עבודה.', icon: Settings },
  { days: 'ימים 25–33', title: 'סקייל וקהילה', text: 'פיננסים, שותפויות, קהילה והמשך צמיחה.', icon: BarChart3 },
];
export function ProgramHighlights() { return <div className="pricing-journey-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{HIGHLIGHTS.map(item => <article key={item.days} className="glass-card p-6 text-start"><item.icon className="mb-5 h-6 w-6 text-[#b79043]" strokeWidth={1.4} /><p className="mb-2 text-[11px] tracking-[.15em] text-[#b79043]">{item.days}</p><h3 className="mb-2 text-lg text-white">{item.title}</h3><p className="text-sm font-light leading-relaxed text-white/50">{item.text}</p></article>)}</div>; }
