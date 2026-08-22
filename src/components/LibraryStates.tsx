import React from 'react';

export function CourseCardSkeleton() {
  return (
    <div className="shrink-0 w-[220px] sm:w-[260px] animate-pulse" aria-hidden>
      <div className="aspect-[16/9] rounded-xl bg-white/10" />
      <div className="mt-2 h-3 w-3/4 rounded bg-white/10" />
      <div className="mt-2 h-2.5 w-1/2 rounded bg-white/5" />
    </div>
  );
}

export function RailSkeleton({ title }: { title: string }) {
  return (
    <section className="py-3 px-4 sm:px-8" aria-busy="true" aria-label={`${title} בטעינה`}>
      <div className="h-5 w-40 rounded bg-white/10 mb-3 animate-pulse" />
      <div className="flex gap-3 sm:gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-4 sm:mx-8 my-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-right flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <p className="text-sm text-white/60" role="alert">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:border-[#C8A24C] min-h-11"
        >
          ניסיון נוסף
        </button>
      )}
    </div>
  );
}
