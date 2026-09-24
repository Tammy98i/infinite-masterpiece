import React from 'react';

export function CourseCardSkeleton() {
  return (
    <div className="shrink-0 w-[220px] sm:w-[260px] animate-pulse" aria-hidden>
      <div className="aspect-[16/9] rounded-[4px] bg-white/10" />
      <div className="mt-2 h-2.5 w-2/3 rounded-[4px] bg-white/10" />
    </div>
  );
}

export function RailSkeleton({ title }: { title: string }) {
  return (
    <section className="py-8 px-4 sm:px-8" aria-busy="true" aria-label={`${title} בטעינה`}>
      <div className="h-4 w-36 rounded-[4px] bg-white/10 mb-4 animate-pulse" />
      <div className="flex gap-2 overflow-hidden">
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
    <div className="library-empty-panel mx-4 sm:mx-8 my-6 px-5 py-6 flex flex-col items-start gap-4">
      <p className="text-sm text-white/60" role="alert">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="library-empty-cta shrink-0 px-4 py-2 text-sm min-h-11 cursor-pointer"
        >
          ניסיון נוסף
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  eyebrow = 'ספרייה',
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  eyebrow?: string;
}) {
  return (
    <div className="library-empty-panel p-8 sm:p-10">
      <p className="library-empty-eye">{eyebrow}</p>
      <h3 className="font-heading text-xl text-white">{title}</h3>
      <p className="text-sm text-white/55 font-light leading-relaxed mb-6">{body}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="library-empty-cta px-6 py-2.5 text-sm font-semibold min-h-11 cursor-pointer transition-colors duration-200"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black" aria-busy="true" aria-label="טוען נגן">
      <div className="w-16 h-16 rounded-[4px] border border-[#b79043]/30 bg-white/[0.03] animate-pulse" />
      <p className="text-sm text-white/45">טוען נגן</p>
    </div>
  );
}
