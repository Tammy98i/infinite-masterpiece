import { X } from 'lucide-react';

type ActiveFilter = { id: string; label: string; onRemove: () => void };

export function ActiveLibraryFilters({ filters, onClear }: { filters: ActiveFilter[]; onClear: () => void }) {
  if (!filters.length) return null;
  return (
    <div className="library-active-filters" role="group" aria-label="מסננים פעילים">
      <span>מסננים פעילים:</span>
      {filters.map(filter => (
        <button key={filter.id} type="button" onClick={filter.onRemove} aria-label={`הסרת מסנן: ${filter.label}`}>
          {filter.label}<X size={14} aria-hidden="true" />
        </button>
      ))}
      <button type="button" className="library-clear-filters" onClick={onClear}>ניקוי כל המסננים</button>
    </div>
  );
}
