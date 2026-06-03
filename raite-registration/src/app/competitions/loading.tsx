import { Skeleton } from "@/components/ui/skeleton";

export default function CompetitionsLoading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="space-y-4 mb-12">
        <Skeleton className="h-12 w-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <Skeleton className="h-6 w-full max-w-lg bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <Skeleton className="h-12 flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <Skeleton className="h-12 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[400px] bg-gray-50 dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 space-y-6">
            <div className="flex justify-between items-start">
              <Skeleton className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-gray-800" />
              <Skeleton className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Skeleton className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
              <Skeleton className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            </div>
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-12 flex-1 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <Skeleton className="h-12 flex-1 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
