import "server-only";
import { Resend } from "resend";

/**
 * Notification transport.
 *
 * Email is deliberately optional: without Resend credentials every
 * notification is logged to the server console rather than throwing, so an
 * email provider outage or incomplete setup can never break an order.
 */
export type NotificationEvent =
  | "order_placed"
  | "payment_confirmed"
  | "payment_failed"
  | "order_status_changed"
  | "custom_cake_request"
  | "custom_cake_received"
  | "custom_cake_quoted"
  | "custom_cake_approved"
  | "admin_new_order";

type Payload = Record<string, unknown>;

const TEMPLATES: Record<
  NotificationEvent,
  (payload: Payload) => { subject: string; body: string }
> = {
  order_placed: (p) => ({
    subject: `Order ${p.orderNumber} received — ${p.brandName}`,
    body: `Thank you, ${p.customerName}. We've received order ${p.orderNumber} for delivery on ${p.deliveryDate} (${p.deliverySlot}). Total: ₹${p.total}.`,
  }),
  payment_confirmed: (p) => ({
    subject: `Payment confirmed for order ${p.orderNumber}`,
    body: `We've received ₹${p.total} for order ${p.orderNumber}. Your order is confirmed and heading into our kitchen.`,
  }),
  payment_failed: (p) => ({
    subject: `Payment didn't go through for order ${p.orderNumber}`,
    body: `We couldn't confirm your payment for order ${p.orderNumber}. Nothing has been charged. Contact the bakery and we'll help you complete it.`,
  }),
  order_status_changed: (p) => ({
    subject: `Order ${p.orderNumber} is now ${p.status}`,
    body: `Your order ${p.orderNumber} has moved to "${p.status}".${p.note ? ` Note: ${p.note}` : ""}`,
  }),
  custom_cake_request: (p) => ({
    subject: `New custom cake request ${p.requestNumber}`,
    body: `${p.customerName} submitted a custom cake request for ${p.requiredDate}. Estimated at ₹${p.estimate}. Review it in the admin panel.`,
  }),
  custom_cake_received: (p) => ({
    subject: `We received your cake request ${p.requestNumber}`,
    body: `Thank you, ${p.customerName}. We've received your custom cake request for ${p.requiredDate}, currently estimated at ₹${p.estimate}. Our team will review the design and contact you with the next step.`,
  }),
  custom_cake_quoted: (p) => ({
    subject: `Your cake quote is ready — ${p.requestNumber}`,
    body: `We've reviewed your design. The quoted price is ₹${p.amount}.${p.note ? ` ${p.note}` : ""} Open your request to pay securely.`,
  }),
  custom_cake_approved: (p) => ({
    subject: `Your custom cake is confirmed — ${p.requestNumber}`,
    body: `Your custom cake request ${p.requestNumber} is approved and scheduled.`,
  }),
  admin_new_order: (p) => ({
    subject: `New order ${p.orderNumber} · ₹${p.total}`,
    body: `${p.customerName} placed order ${p.orderNumber} for ${p.deliveryDate} (${p.deliverySlot}). Payment: ${p.paymentMethod}.`,
  }),
};

const ADMIN_EVENTS = new Set<NotificationEvent>([
  "admin_new_order",
  "custom_cake_request",
]);

let resendClient: Resend | undefined;

function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function getResend() {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

async function deliver(
  event: NotificationEvent,
  to: string,
  subject: string,
  body: string,
) {
  if (!resendConfigured()) {
    console.info(`[notify:console] → ${to}\n  ${subject}\n  ${body}`);
    return { delivered: false, reason: "resend_not_configured" as const };
  }

  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    text: body,
    html: renderEmail(subject, body),
    replyTo: process.env.RESEND_REPLY_TO || undefined,
    tags: [{ name: "event", value: event }],
  });

  if (error) throw new Error(`Resend: ${error.message}`);

  console.info(`[notify:resend] ${data?.id ?? "sent"} → ${to} — ${subject}`);
  return { delivered: true as const, id: data?.id };
}

export async function notify(event: NotificationEvent, payload: Payload) {
  try {
    const template = TEMPLATES[event];
    if (!template) return;
    const { subject, body } = template(payload);

    const recipients = new Set<string>();
    if (ADMIN_EVENTS.has(event)) {
      const adminEmail = process.env.NOTIFY_ADMIN_EMAIL;
      if (adminEmail) recipients.add(adminEmail);
      else {
        console.warn(
          `[notify] skipped ${event}: NOTIFY_ADMIN_EMAIL is not configured`,
        );
      }
    } else if (
      typeof payload.customerEmail === "string" &&
      payload.customerEmail
    ) {
      recipients.add(payload.customerEmail);
    }

    for (const recipient of recipients) {
      await deliver(event, recipient, subject, body);
    }
  } catch (error) {
    // A notification must never break an order.
    console.error("[notify] failed", event, error);
  }
}

function renderEmail(subject: string, body: string) {
  const safeSubject = escapeHtml(subject);
  const safeBody = escapeHtml(body);

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f8f2ed;color:#452b26;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${safeBody}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f2ed;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #eadbd1;border-radius:8px;overflow:hidden">
            <tr>
              <td style="background:#452b26;padding:20px 28px;color:#fff;font-size:20px;font-weight:700">Bake Baba'z</td>
            </tr>
            <tr>
              <td style="padding:32px 28px">
                <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;line-height:1.25;color:#452b26">${safeSubject}</h1>
                <p style="margin:0;font-size:16px;line-height:1.7;color:#6f5750">${safeBody}</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #eadbd1;padding:18px 28px;font-size:12px;line-height:1.5;color:#8b746d">Handcrafted with care in Bikaner.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character]!,
  );
}
