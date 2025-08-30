import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-8 p-4 pt-6 md:p-8">
      {/* Hero Skeleton */}
      <div className="relative overflow-hidden rounded-xl bg-muted/50 p-8">
        <div className="relative z-10 max-w-3xl space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      {/* Section Skeletons */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-2">
                <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
