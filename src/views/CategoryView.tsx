import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/CourseCard';
import { Layers } from 'lucide-react';
import { coursesInCategory } from '../utils/recommendations';
import { filterCatalogCourses, type CatalogFilter } from '../utils/searchCatalog';
import { EmptyState } from '../components/LibraryStates';

const FILTERS: Array<{ id: CatalogFilter; label: string }> = [
  { id: 'all', label: 'הכול' },
  { id: 'open', label: 'פתוח לצפייה' },
  { id: 'short', label: 'עד 10 דקות' },
  { id: 'new', label: 'חדש' },
];

export const CategoryView: React.FC = () => {
  const { categories, courses, selectedCategoryId, instructors, user } = useApp();
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>('all');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');

  const currentCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const leads = instructors.filter((i) => currentCategory.leadInstructorIds?.includes(i.id));
  const baseCourses = coursesInCategory(courses, currentCategory.id);

  const categoryInstructors = useMemo(() => {
    const ids = new Set(baseCourses.map((c) => c.instructorId));
    return instructors.filter((i) => ids.has(i.id));
  }, [baseCourses, instructors]);

  const filteredCourses = filterCatalogCourses(baseCourses, user, activeFilter, selectedInstructor);

  return (
    <div className="min-h-screen text-white pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      <div
        className="rounded-3xl p-8 mb-10 relative overflow-hidden text-right border border-white/10"
        style={
          currentCategory.coverImage
            ? {
                backgroundImage: `linear-gradient(to left, rgba(5,5,5,0.92), rgba(5,5,5,0.55)), url(${currentCategory.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="flex items-center gap-2 text-[#C8A24C] text-xs mb-2">
          <Layers className="w-4 h-4" />
          <span>נושא</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-semibold mb-3 text-white">{currentCategory.name}</h1>

        <p className="text-white/60 text-base sm:text-lg max-w-2xl leading-relaxed font-light">
          {currentCategory.description}
        </p>
        {leads.length > 0 && (
          <p className="text-sm text-white/40 mt-4">
            מרצים מובילים: {leads.map((i) => i.name).join(' · ')}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="סינון תכנים">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all min-h-11 whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-[#C8A24C] text-black'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {filter.label}
              {filter.id === 'all' ? ` (${baseCourses.length})` : ''}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-white/55">
          <span className="sr-only">לפי מרצה</span>
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C8A24C] min-h-11"
            aria-label="סינון לפי מרצה"
          >
            <option value="all">לפי מרצה: הכול</option>
            {categoryInstructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
          {filteredCourses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              fullWidth
              sectionName={`category_${currentCategory.id}`}
              position={index}
              showNewBadge
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="אין תכנים שמתאימים לסינון"
          body="אפשר לבחור סינון אחר, או לחזור לנושא מלא."
        />
      )}
    </div>
  );
};
