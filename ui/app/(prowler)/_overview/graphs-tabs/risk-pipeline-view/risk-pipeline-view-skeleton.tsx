import { Skeleton } from "@/components/shadcn/skeleton/skeleton";

export function RiskPipelineViewSkeleton() {
  return (
    <div className="border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-800 dark:bg-slate-900/80 flex h-[460px] w-full flex-col space-y-4 rounded-lg border p-4">
      <Skeleton className="h-6 w-1/4 rounded" />
      <div className="flex flex-1 items-center justify-center">
        <Skeleton className="h-[380px] w-full rounded" />
      </div>
    </div>
  );
}
