import { Skeleton } from "@/components/ui/skeleton";

/** Shown while a dashboard page loads: the header stays, the content keeps its rough shape. */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-10">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}
