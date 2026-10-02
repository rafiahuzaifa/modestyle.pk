import { claimAbandonedCheckouts, getAudience, getUnsubscribeToken } from "@/lib/marketing";
import { isEmailConfigured, sendEmail } from "@/lib/notify";
import { isWhatsAppConfigured, sendTemplate, TEMPLATES } from "@/lib/whatsapp";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** Promo code offered in cart-recovery messages; must be one of the codes lib/orders accepts. */
export const CART_RECOVERY_CODE = process.env.CART_RECOVERY_CODE || "WELCOME10";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const firstName = (name: string | null) => (name || "").trim().split(/\s+/)[0] || "there";

function unsubscribeUrl(token: string | null) {
  return token ? `${SITE_URL}/api/unsubscribe?token=${token}` : `${SITE_URL}/contact`;
}

function offerEmailHtml(opts: {
  name: string | null;
  headline: string;
  message: string;
  code?: string;
  ctaUrl: string;
  ctaText: string;
  unsubscribe: string;
}) {
  const paragraphs = esc(opts.message)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1f1f1f">
    <p style="font-size:22px;margin:0 0 4px"><span style="color:#b8964e">Modest</span>Style<span style="color:#b8964e;font-size:13px">.pk</span></p>
    <hr style="border:none;border-top:1px solid #eee;margin:12px 0 20px">
    <h2 style="font-weight:normal;margin:0 0 14px">${esc(opts.headline)}</h2>
    <p style="margin:0 0 14px">Assalam o Alaikum ${esc(firstName(opts.name))},</p>
    ${paragraphs}
    ${
      opts.code
        ? `<p style="text-align:center;margin:22px 0"><span style="display:inline-block;border:2px dashed #b8964e;padding:10px 22px;font-size:20px;letter-spacing:3px">${esc(opts.code)}</span></p>`
        : ""
    }
    <p style="text-align:center;margin:24px 0">
      <a href="${opts.ctaUrl}" style="background:#1f1f1f;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;display:inline-block">${esc(opts.ctaText)}</a>
    </p>
    <p style="font-size:11px;color:#999;text-align:center;margin-top:32px">
      You're receiving this because you shopped or subscribed at ${esc(SITE_NAME)}.
      <a href="${opts.unsubscribe}" style="color:#999">Unsubscribe</a>
    </p>
  </div>`;
}

/** Sends one reminder (WhatsApp + email) to each opted-in shopper who left checkout without ordering. */
export async function sendCartReminders() {
  // Idle ≥ 1h, at most 3 days old.
  const carts = await claimAbandonedCheckouts(60, 72);
  let whatsapp = 0;
  let email = 0;

  for (const cart of carts) {
    try {
      if (cart.phone && isWhatsAppConfigured()) {
        const r = await sendTemplate(cart.phone, TEMPLATES.cartReminder, [firstName(cart.name), CART_RECOVERY_CODE], [
          { type: "url", index: 0, text: "checkout" },
        ]);
        if (r.ok) whatsapp++;
      }
      if (cart.email && isEmailConfigured()) {
        const token = await getUnsubscribeToken(cart.email, cart.phone);
        const unsubscribe = unsubscribeUrl(token);
        const ok = await sendEmail(
          [cart.email],
          `You left something beautiful behind 🤍`,
          offerEmailHtml({
            name: cart.name,
            headline: "Your bag is waiting for you",
            message: `We saved the items in your bag. Complete your order today and enjoy 10% off with the code below — plus free delivery on orders over PKR 5,000.`,
            code: CART_RECOVERY_CODE,
            ctaUrl: `${SITE_URL}/checkout`,
            ctaText: "Complete My Order",
            unsubscribe,
          }),
          { "List-Unsubscribe": `<${unsubscribe}>` }
        );
        if (ok) email++;
      }
    } catch (err) {
      console.error("Cart reminder failed for", cart.id, err);
    }
  }
  return { checked: carts.length, whatsapp, email };
}

export interface BroadcastInput {
  subject: string;
  message: string;
  code?: string;
  channels: { email: boolean; whatsapp: boolean };
}

/** Sends a sale/offer campaign to every opted-in subscriber on the chosen channels. */
export async function sendBroadcast(input: BroadcastInput) {
  const audience = await getAudience();
  const result = { email: 0, whatsapp: 0, failed: 0 };

  if (input.channels.email && isEmailConfigured()) {
    for (const s of audience.filter((a) => a.email_opt_in && a.email)) {
      const unsubscribe = unsubscribeUrl(s.unsubscribe_token);
      const ok = await sendEmail(
        [s.email!],
        input.subject,
        offerEmailHtml({
          name: s.name,
          headline: input.subject,
          message: input.message,
          code: input.code,
          ctaUrl: `${SITE_URL}/products`,
          ctaText: "Shop the Sale",
          unsubscribe,
        }),
        { "List-Unsubscribe": `<${unsubscribe}>` }
      ).catch(() => false);
      if (ok) result.email++;
      else result.failed++;
    }
  }

  if (input.channels.whatsapp && isWhatsAppConfigured()) {
    // WhatsApp template params can't contain newlines or 4+ consecutive spaces.
    const offer = [input.message.replace(/\s*\n+\s*/g, " ").replace(/\s{4,}/g, "   "), input.code && `Use code ${input.code}.`]
      .filter(Boolean)
      .join(" ");
    for (const s of audience.filter((a) => a.whatsapp_opt_in && a.phone)) {
      const r = await sendTemplate(s.phone!, TEMPLATES.saleOffer, [firstName(s.name), offer]).catch(() => ({ ok: false }));
      if (r.ok) result.whatsapp++;
      else result.failed++;
    }
  }

  return result;
}
