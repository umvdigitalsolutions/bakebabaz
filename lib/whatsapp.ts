/**
 * Single place that builds wa.me links, so support messages always arrive with
 * the context the bakery needs.
 */
export function whatsappLink(number: string, message: string) {
  const digits = (number || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const whatsappMessages = {
  general: (brand: string) =>
    `Hi ${brand}, I'd like to know more about your cakes and bakes.`,
  product: (brand: string, productName: string, url?: string) =>
    `Hi ${brand}, I'm interested in "${productName}".${url ? `\n${url}` : ""}`,
  order: (brand: string, orderNumber: string) =>
    `Hi ${brand},\nI need help regarding Order #${orderNumber}.`,
  customCake: (brand: string, requestNumber: string) =>
    `Hi ${brand},\nI'd like to discuss my custom cake request #${requestNumber}.`,
  customCakeIdea: (brand: string) =>
    `Hi ${brand}, I have a custom cake idea I'd like to discuss.`,
};
