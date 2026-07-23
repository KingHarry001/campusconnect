// src/components/ui/SkeletonDashboardCard.tsx
import { Skeleton } from "./Skeleton";

export function SkeletonStatCard() {
  return (
    <div className="bg-white/5 rounded-2xl p-4 min-h-[76px] flex flex-col justify-between">
      <Skeleton className="h-3 w-20 mb-2 bg-white/10" />
      <Skeleton className="h-5 w-10 bg-white/10" />
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 dark:border-white/5 pb-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-gray-100 dark:border-white/10 p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}