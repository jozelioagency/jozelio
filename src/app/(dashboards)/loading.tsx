export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Header skeleton */}
      <div className="h-20 border-b-2 border-brand-blue/10 bg-brand-white flex items-center px-8 gap-4">
        <div className="w-28 h-6 bg-brand-blue/10 animate-pulse rounded" />
        <div className="flex-1" />
        <div className="w-8 h-8 rounded-full bg-brand-blue/10 animate-pulse" />
      </div>
      <div className="flex flex-1">
        {/* Sidebar skeleton */}
        <div className="w-64 border-r-2 border-brand-blue/10 bg-brand-white p-6 flex flex-col gap-3 hidden md:flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-brand-blue/10 animate-pulse rounded" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-8 flex flex-col gap-6">
          <div className="h-8 w-48 bg-brand-blue/10 animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-brand-white border-2 border-brand-blue/10 animate-pulse rounded" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          <div className="h-64 bg-brand-white border-2 border-brand-blue/10 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
