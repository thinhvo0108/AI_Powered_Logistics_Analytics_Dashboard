import { ChartSkeleton } from "@/components/dashboard/ChartSkeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-9 animate-pulse rounded-md bg-slate-200" />
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="h-20 animate-pulse rounded-lg bg-white shadow-sm" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white p-4 shadow-sm" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    </div>
  );
}
