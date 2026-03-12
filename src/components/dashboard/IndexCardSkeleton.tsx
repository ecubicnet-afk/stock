'use client';
export function IndexCardSkeleton() {
  return (
    <div className="bg-bg-card backdrop-blur-sm border border-border rounded-xl p-4 animate-pulse">
      <div className="flex justify-between mb-2">
        <div className="h-3 w-20 bg-bg-secondary rounded" />
        <div className="h-3 w-12 bg-bg-secondary rounded" />
      </div>
      <div className="h-7 w-28 bg-bg-secondary rounded mb-1" />
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-16 bg-bg-secondary rounded" />
        <div className="h-4 w-14 bg-bg-secondary rounded" />
      </div>
      <div className="h-10 bg-bg-secondary rounded" />
    </div>
  );
}
