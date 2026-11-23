import { SlidersHorizontal } from 'lucide-react';
import { ActiveLibraryFilters } from './ActiveLibraryFilters';

export type SearchFilterState = { duration: string; level: string; access: string; sort: string };
export const EMPTY_FILTERS: SearchFilterState = { duration: 'all', level: 'all', access: 'all', sort: 'relevance' };
const FIELDS = [
  { key: 'duration', label: 'משך', options: [['all', 'כל המשכים'], ['short', 'עד 15 דקות'], ['medium', '15–45 דקות'], ['long', 'מעל 45 דקות']] },
  { key: 'level', label: 'רמה', options: [['all', 'כל הרמות'], ['למתחילים', 'למתחילים'], ['מתקדם', 'מתקדם'], ['לכל הרמות', 'לכל הרמות']] },
  { key: 'access', label: 'גישה', options: [['all', 'כל הגישות'], ['open', 'פתוח'], ['preview', 'טעימה'], ['locked', 'דורש מנוי']] },
] as const;

export function SearchFilters({ value, onChange, activeCount }: { value: SearchFilterState; onChange: (value: SearchFilterState) => void; activeCount: number }) {
  const field = (key: keyof SearchFilterState, next: string) => onChange({ ...value, [key]: next });
  return (
    <div className="library-page-toolbar library-search-filters mb-6">
      <p className="flex items-center gap-2 text-sm mb-3"><SlidersHorizontal size={16} aria-hidden="true" />סינון ומיון{activeCount > 0 ? ` · ${activeCount} מסננים פעילים` : ''}</p>
      <div className="library-filter-fields">
        {FIELDS.map(({ key, label, options }) => (
          <label key={key}>
            <span>{label}</span>
            <select value={value[key]} onChange={event => field(key, event.target.value)} aria-label={`סינון לפי ${label}`}>
              {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
            </select>
          </label>
        ))}
        <label>
          <span>מיון</span>
          <select value={value.sort} onChange={event => field('sort', event.target.value)} aria-label="מיון תוצאות">
            <option value="relevance">הכי רלוונטי</option><option value="newest">החדש ביותר</option><option value="shortest">הקצר ביותר</option>
          </select>
        </label>
      </div>
      <ActiveLibraryFilters
        filters={FIELDS.filter(({ key }) => value[key] !== 'all').map(({ key, options }) => ({
          id: key,
          label: options.find(([id]) => id === value[key])?.[1] || value[key],
          onRemove: () => field(key, 'all'),
        }))}
        onClear={() => onChange(EMPTY_FILTERS)}
      />
    </div>
  );
}
