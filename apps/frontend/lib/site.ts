export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://modestyle.pk";

export const SITE_NAME = "ModestStyle.pk";

/** Store WhatsApp number in international format without "+" (e.g. 923001234567).
 * Set NEXT_PUBLIC_WHATSAPP_NUMBER on Vercel to the real business number. */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923323025239").replace(/\D/g, "");

/** Human-readable form, e.g. "+92 300 1234567". */
export const WHATSAPP_DISPLAY = `+${WHATSAPP_NUMBER.slice(0, 2)} ${WHATSAPP_NUMBER.slice(2, 5)} ${WHATSAPP_NUMBER.slice(5)}`;

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@modestyle.pk";

export function whatsappLink(message?: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
