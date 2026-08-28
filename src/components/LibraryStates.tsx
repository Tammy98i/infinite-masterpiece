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
    <section className="py-8 px-4 sm:px-8" aria-busy="true" aria-label={`${title} בטעינה`}>
      <div className="h-5 w-40 rounded bg-white/10 mb-4 animate-pulse" />
      <div className="flex gap-5 overflow-hidden">
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
    <div className="mx-4 sm:mx-8 my-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-center flex flex-col items-center gap-4">
      <p className="text-sm text-white/60" role="alert">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 px-4 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:border-[#C8A24C] min-h-11 cursor-pointer"
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
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 sm:p-14 text-center max-w-lg mx-auto">
      <h3 className="font-heading text-xl text-white mb-3">{title}</h3>
      <p className="text-sm text-white/50 font-light leading-relaxed mb-8">{body}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="px-8 py-3 rounded-full bg-[#C8A24C] text-black text-sm font-semibold min-h-11 cursor-pointer hover:bg-[#F7E7B5] transition-colors duration-500"
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
      <div className="w-16 h-16 rounded-full border border-[#C8A24C]/30 bg-white/[0.03] animate-pulse" />
      <p className="text-sm text-white/45">טוען נגן</p>
    </div>
  );
}
