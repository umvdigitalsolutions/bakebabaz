import { MessageSquareQuote } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { formatDate } from "@/lib/utils";

export type ReviewData = {
  _id: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  adminReply?: string;
  createdAt: string;
};

export function ReviewsSection({
  reviews,
  summary,
}: {
  reviews: ReviewData[];
  summary: { average: number; count: number };
}) {
  return (
    <section id="reviews" className="scroll-mt-28">
      <div className="border-line mb-8 flex flex-wrap items-end justify-between gap-5 border-b pb-6">
        <div>
          <h2 className="display-3">What people said</h2>
          {summary.count > 0 && reviews.length > 0 ? (
            <div className="mt-3 flex items-center gap-3">
              <Rating value={summary.average} showCount={false} size={17} />
              <span className="text-muted text-sm">
                {summary.average.toFixed(1)} out of 5 · {summary.count} review
                {summary.count === 1 ? "" : "s"}
              </span>
            </div>
          ) : null}
        </div>
        <p className="text-muted max-w-xs text-sm">
          Reviews come from customers with a delivered order, and are published
          after a quick check by our team.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="border-line-strong/60 bg-cream/50 flex items-center gap-4 rounded-[22px] border border-dashed px-6 py-8">
          <MessageSquareQuote className="text-coral size-6 flex-none" />
          <p className="text-muted text-sm">
            No reviews yet. Order this one and you could be the first —
            we&rsquo;ll invite you to review it once it&rsquo;s delivered.
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {reviews.map((review) => (
            <li
              key={review._id}
              className="border-line rounded-[22px] border bg-white p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <Rating value={review.rating} showCount={false} />
                <span className="text-muted text-xs">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              {review.title ? (
                <h3 className="font-display mt-3 text-lg tracking-[-0.01em]">
                  {review.title}
                </h3>
              ) : null}
              <p className="text-muted mt-2 text-[15px] leading-relaxed">
                {review.comment}
              </p>
              <p className="mt-4 text-[13px] font-semibold">
                {review.customerName}
                {review.verifiedPurchase ? (
                  <span className="bg-pistachio/15 ml-2 rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-[0.08em] text-[#5b6034] uppercase">
                    Verified
                  </span>
                ) : null}
              </p>
              {review.adminReply ? (
                <div className="bg-cream mt-4 rounded-2xl px-4 py-3">
                  <p className="text-coral-dark text-[11px] font-bold tracking-[0.1em] uppercase">
                    Bake Baba&rsquo;z replied
                  </p>
                  <p className="text-muted mt-1 text-sm">{review.adminReply}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
