import { SlidersHorizontal, X } from 'lucide-react';
export type SearchFilterState = { duration: string; level: string; access: string; sort: string };
export const EMPTY_FILTERS: SearchFilterState = { duration: 'all', level: 'all', access: 'all', sort: 'relevance' };
export function SearchFilters({ value, onChange, activeCount }: { value: SearchFilterState; onChange: (value: SearchFilterState) => void; activeCount: number }) {
  const field = (key: keyof SearchFilterState, next: string) => onChange({ ...value, [key]: next });
  const control = 'min-h-11 min-w-0 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-2 sm:px-3 text-xs sm:text-sm text-white/70 outline-none focus:border-[#b79043] sm:w-auto';
  return <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
    <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
      <span className="col-span-2 me-1 inline-flex items-center gap-2 text-sm text-white/50 sm:col-span-1"><SlidersHorizontal size={16} className="text-[#b79043]" />סינון</span>
      <select value={value.duration} onChange={event => field('duration', event.target.value)} className={control} aria-label="סינון לפי משך"><option value="all">כל המשכים</option><option value="short">עד 15 דקות</option><option value="medium">15–45 דקות</option><option value="long">מעל 45 דקות</option></select>
      <select value={value.level} onChange={event => field('level', event.target.value)} className={control} aria-label="סינון לפי רמה"><option value="all">כל הרמות</option><option value="למתחילים">למתחילים</option><option value="מתקדם">מתקדם</option><option value="לכל הרמות">לכל הרמות</option></select>
      <select value={value.access} onChange={event => field('access', event.target.value)} className={control} aria-label="סינון לפי גישה"><option value="all">כל אפשרויות הגישה</option><option value="open">פתוח</option><option value="preview">טעימה</option><option value="locked">דורש מנוי</option></select>
      <select value={value.sort} onChange={event => field('sort', event.target.value)} className={`${control} sm:ms-auto`} aria-label="מיון תוצאות"><option value="relevance">הכי רלוונטי</option><option value="newest">החדש ביותר</option><option value="shortest">הקצר ביותר</option></select>
      {activeCount > 0 ? <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm text-[#b79043] hover:bg-[#b79043]/10 sm:col-span-1" aria-label="ניקוי כל המסננים"><X size={15} />ניקוי ({activeCount})</button> : null}
    </div>
  </div>;
}
