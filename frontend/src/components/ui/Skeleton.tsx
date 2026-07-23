// src/components/ui/Skeleton.tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded-xl ${className}`} />
  );
}