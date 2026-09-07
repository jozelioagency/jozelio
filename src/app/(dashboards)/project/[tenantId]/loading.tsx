export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="h-20 border-b-2 border-brand-blue/10 bg-brand-white flex items-center px-8 gap-4">
        <div className="w-8 h-8 bg-brand-blue/10 animate-pulse rounded" />
        <div className="w-36 h-5 bg-brand-blue/10 animate-pulse rounded" />
        <div className="flex-1" />
        <div className="w-24 h-8 bg-brand-blue/10 animate-pulse rounded" />
      </div>
      <div className="flex flex-1">
        <div className="w-56 border-r-2 border-brand-blue/10 bg-brand-white p-4 flex flex-col gap-2 hidden md:flex">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-9 bg-brand-blue/10 animate-pulse rounded" style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
        <div className="flex-1 p-6 flex flex-col gap-5">
          <div className="h-7 w-40 bg-brand-blue/10 animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-brand-white border-2 border-brand-blue/10 animate-pulse rounded" style={{ animationDelay: `${i * 70}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
