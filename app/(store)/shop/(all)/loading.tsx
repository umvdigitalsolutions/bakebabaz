import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ShopLoading() {
  return (
    <div className="wrap pt-10 pb-20 sm:pt-14">
      <div className="mb-14 space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-2/3 max-w-xl" />
        <Skeleton className="h-5 w-1/2 max-w-md" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[248px_1fr] lg:gap-14">
        <div className="hidden space-y-6 lg:block">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-3/4" />
            </div>
          ))}
        </div>
        <ProductGridSkeleton count={9} />
      </div>
    </div>
  );
}
