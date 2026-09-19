import { EmptyState } from "@/components/ui/EmptyState";
import { CakeSlice } from "lucide-react";

export default function StoreNotFound() {
  return (
    <div className="wrap max-w-2xl py-24 sm:py-32">
      <EmptyState
        icon={<CakeSlice className="size-6" />}
        titleAs="h1"
        title="We couldn’t find that page"
        description="The link may be out of date, or the product may have been retired. Try the shop, or design something new."
        actionLabel="Browse the shop"
        actionHref="/shop"
        secondaryLabel="Back home"
        secondaryHref="/"
      />
    </div>
  );
}
