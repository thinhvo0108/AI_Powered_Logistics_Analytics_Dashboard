interface ChartSkeletonProps {
  className?: string;
}

export function ChartSkeleton({ className }: ChartSkeletonProps) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ${className ?? ""}`}>
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-72 animate-pulse rounded-lg bg-slate-100" />
    </div>
  );
}
