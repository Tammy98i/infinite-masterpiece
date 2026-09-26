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
    <div className="library-catalog-page library-bottom-clearance min-h-screen text-white pt-32 px-4 sm:px-8 lg:px-10 max-w-[1400px] mx-auto">
      <div
        className="library-page-hero relative overflow-hidden text-start p-8 md:p-12 mb-8 border"
        style={
          currentCategory.coverImage
            ? {
                backgroundImage: `linear-gradient(to left, rgba(20,20,20,0.94), rgba(0,0,0,0.58)), url(${currentCategory.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/40 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/70 text-xs mb-2">
            <Layers className="w-4 h-4" />
            <span>נושא</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold mb-3 text-white">{currentCategory.name}</h1>

          <p className="text-white/70 text-base sm:text-lg max-w-2xl leading-relaxed font-light">
            {currentCategory.description}
          </p>
          {leads.length > 0 && (
            <p className="text-sm text-white/50 mt-4">
              מרצים מובילים: {leads.map((i) => i.name).join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="library-page-toolbar flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 p-3 border">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1" role="group" aria-label="סינון תכנים">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`library-page-chip px-3 sm:px-4 py-2 text-sm font-medium transition-all min-h-11 whitespace-nowrap shrink-0 ${
                activeFilter === filter.id
                  ? 'bg-white text-[#141414]'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {filter.label}
              {filter.id === 'all' ? ` (${baseCourses.length})` : ''}
            </button>
          ))}
        </div>

        <label className="flex w-full sm:w-auto items-center gap-2 text-sm text-white/55">
          <span className="sr-only">לפי מרצה</span>
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="w-full sm:w-auto bg-[#141414] border border-white/15 rounded-[4px] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#b79043] min-h-11"
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
        <div className="library-page-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-stretch">
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
          eyebrow="נושא"
          title="אין תכנים שמתאימים לסינון"
          body="אפשר לבחור סינון אחר, או לחזור לנושא מלא."
        />
      )}
    </div>
  );
};
