export default function QueryLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-9 animate-pulse rounded-md bg-slate-200" />
      </div>

      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col gap-4 lg:w-[60%]">
            <div className="h-24 animate-pulse rounded-lg bg-white shadow-sm" />
            <div className="h-48 animate-pulse rounded-lg bg-white shadow-sm" />
          </div>
          <div className="lg:w-[40%]">
            <div className="h-10 w-28 animate-pulse rounded-full bg-white shadow-sm" />
          </div>
        </div>

        <div className="h-40 animate-pulse rounded-lg bg-white shadow-sm" />
      </div>
    </div>
  );
}
