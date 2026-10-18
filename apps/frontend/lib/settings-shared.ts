/** Store settings shape + defaults. Safe to import from client components. */

export interface PromoCode {
  code: string;
  percent: number;
  active: boolean;
}

export interface StoreSettings {
  announcement: string;
  /** International format without "+", e.g. 923323025239 */
  whatsappNumber: string;
  supportEmail: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  freeShippingThreshold: number;
  standardShipping: number;
  expressShipping: number;
  codFee: number;
  popupPromoCode: string;
  cartRecoveryCode: string;
  promoCodes: PromoCode[];
  /** Advance payment by bank transfer / Raast / mobile wallet (verified manually by the admin). */
  transferEnabled: boolean;
  transferAccountTitle: string;
  transferBankName: string;
  transferIban: string;
  transferAccountNumber: string;
  transferRaastId: string;
  transferJazzcash: string;
  transferEasypaisa: string;
  transferNote: string;
}

/** Settings minus anything customers shouldn't see (the promo code list). */
export type PublicSettings = Omit<StoreSettings, "promoCodes"> & {
  /** Discount % of the popup code, or 0 if that code isn't an active promo (popup then stays hidden). */
  popupPromoPercent: number;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: "FREE SHIPPING ON ORDERS OVER PKR 5,000  |  EASY RETURNS",
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923323025239").replace(/\D/g, ""),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@modestyle.pk",
  instagram: "https://instagram.com/modestyle.pk",
  facebook: "https://facebook.com/modestyle.pk",
  tiktok: "https://tiktok.com/@modestyle.pk",
  freeShippingThreshold: 5000,
  standardShipping: 250,
  expressShipping: 500,
  codFee: 200,
  popupPromoCode: "WELCOME10",
  cartRecoveryCode: "WELCOME10",
  promoCodes: [
    { code: "MODEST10", percent: 10, active: true },
    { code: "WELCOME10", percent: 10, active: true },
  ],
  transferEnabled: false,
  transferAccountTitle: "",
  transferBankName: "",
  transferIban: "",
  transferAccountNumber: "",
  transferRaastId: "",
  transferJazzcash: "",
  transferEasypaisa: "",
  transferNote: "",
};

/** Bank transfer is offered only when switched on and at least one account is filled in. */
export function transferAvailable(s: Pick<StoreSettings, "transferEnabled" | "transferIban" | "transferAccountNumber" | "transferRaastId" | "transferJazzcash" | "transferEasypaisa">) {
  return s.transferEnabled && !!(s.transferIban || s.transferAccountNumber || s.transferRaastId || s.transferJazzcash || s.transferEasypaisa);
}

export function toPublicSettings(s: StoreSettings): PublicSettings {
  const rest: Partial<StoreSettings> = { ...s };
  delete rest.promoCodes;
  const popup = s.promoCodes.find((p) => p.active && p.code === s.popupPromoCode);
  return { ...(rest as Omit<StoreSettings, "promoCodes">), popupPromoPercent: popup?.percent || 0 };
}

export function formatWhatsApp(number: string) {
  return `+${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
}

export function whatsappHref(number: string, message?: string) {
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function formatPkr(n: number) {
  return `PKR ${Math.round(n).toLocaleString("en-PK")}`;
}
