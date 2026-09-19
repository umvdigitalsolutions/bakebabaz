export type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Loads the Razorpay SDK on demand — it never ships in the initial bundle. */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type RazorpayCheckoutOptions = {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
  brandName: string;
  description: string;
  customer: { name?: string; email?: string; phone?: string };
  onSuccess: (response: RazorpayHandlerResponse) => void;
  onDismiss: () => void;
  onFailure: (reason: string) => void;
};

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    options.onFailure(
      "Could not load the payment window. Check your connection and try again.",
    );
    return;
  }

  const razorpay = new window.Razorpay({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    order_id: options.orderId,
    name: options.brandName,
    description: options.description,
    theme: { color: "#ef665f" },
    prefill: {
      name: options.customer.name,
      email: options.customer.email,
      contact: options.customer.phone,
    },
    handler: (response: RazorpayHandlerResponse) => options.onSuccess(response),
    modal: { ondismiss: () => options.onDismiss() },
  });

  razorpay.on("payment.failed", (payload: unknown) => {
    const error = (payload as { error?: { description?: string } })?.error;
    options.onFailure(
      error?.description ?? "Payment failed. Please try again.",
    );
  });

  razorpay.open();
}
