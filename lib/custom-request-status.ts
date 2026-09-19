import type { CustomRequestStatus } from "@/types";

export const REQUEST_STATUS_LABELS: Record<CustomRequestStatus, string> = {
  NEW: "New request",
  UNDER_REVIEW: "Under review",
  NEEDS_CLARIFICATION: "Needs clarification",
  QUOTED: "Quote sent",
  APPROVED: "Approved",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  IN_PRODUCTION: "In production",
  COMPLETED: "Completed",
  REJECTED: "Declined",
};

export const REQUEST_STATUS_BLURBS: Record<CustomRequestStatus, string> = {
  NEW: "We've received your design and will review it shortly.",
  UNDER_REVIEW: "Our team is going through your design and availability.",
  NEEDS_CLARIFICATION: "We need a little more detail before we can quote.",
  QUOTED: "Your quote is ready — review it and confirm to proceed.",
  APPROVED: "Your design is approved and scheduled.",
  PAYMENT_PENDING: "Complete your payment to confirm the booking.",
  PAID: "Payment received. Your cake is booked.",
  IN_PRODUCTION: "Your cake is being made.",
  COMPLETED: "Completed and delivered.",
  REJECTED: "We weren't able to take this one on.",
};
