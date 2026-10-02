import "server-only";
import { createClient } from "next-sanity";
import { revalidateTag } from "next/cache";
import { apiVersion, dataset, projectId, isSanityConfigured } from "@/sanity/env";
import { writeClient } from "@/sanity/lib/write-client";
import { DEFAULT_SETTINGS, type PromoCode, type StoreSettings } from "@/lib/settings-shared";

export const SETTINGS_DOC_ID = "siteSettings";
const SETTINGS_TAG = "settings";

// Non-CDN reads so saved changes appear right after revalidation.
const readClient = isSanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: "published" })
  : null;

interface SettingsDoc {
  announcement?: string;
  supportEmail?: string;
  freeShippingThreshold?: number;
  standardShipping?: number;
  expressShipping?: number;
  codFee?: number;
  popupPromoCode?: string;
  cartRecoveryCode?: string;
  promoCodes?: Partial<PromoCode>[];
  socialLinks?: { instagram?: string; facebook?: string; tiktok?: string; whatsapp?: string };
}

const num = (v: unknown, fallback: number) => (typeof v === "number" && v >= 0 ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);
/** Like str(), but an explicitly saved empty value means "turned off". */
const optional = (v: unknown, fallback: string) => (typeof v === "string" ? v.trim() : fallback);

function merge(doc: SettingsDoc | null): StoreSettings {
  const d = DEFAULT_SETTINGS;
  if (!doc) return d;
  const social = doc.socialLinks || {};
  let whatsapp = (social.whatsapp || "").replace(/\D/g, "");
  if (whatsapp.startsWith("0")) whatsapp = "92" + whatsapp.slice(1);
  return {
    announcement: typeof doc.announcement === "string" ? doc.announcement.trim() : d.announcement,
    whatsappNumber: whatsapp || d.whatsappNumber,
    supportEmail: str(doc.supportEmail, d.supportEmail),
    instagram: str(social.instagram, d.instagram),
    facebook: str(social.facebook, d.facebook),
    tiktok: str(social.tiktok, d.tiktok),
    freeShippingThreshold: num(doc.freeShippingThreshold, d.freeShippingThreshold),
    standardShipping: num(doc.standardShipping, d.standardShipping),
    expressShipping: num(doc.expressShipping, d.expressShipping),
    codFee: num(doc.codFee, d.codFee),
    popupPromoCode: optional(doc.popupPromoCode, d.popupPromoCode).toUpperCase(),
    cartRecoveryCode: optional(doc.cartRecoveryCode, d.cartRecoveryCode).toUpperCase(),
    promoCodes: Array.isArray(doc.promoCodes)
      ? doc.promoCodes
          .filter((p) => typeof p?.code === "string" && p.code.trim())
          .map((p) => ({
            code: p.code!.trim().toUpperCase(),
            percent: Math.min(90, Math.max(0, Number(p.percent) || 0)),
            active: p.active !== false,
          }))
      : d.promoCodes,
  };
}

/** Store settings from Sanity merged over defaults. Cached; refreshed when an admin saves. */
export async function getSettings(): Promise<StoreSettings> {
  if (!readClient) return DEFAULT_SETTINGS;
  try {
    const doc = await readClient.fetch<SettingsDoc | null>(
      `*[_id == $id][0]`,
      { id: SETTINGS_DOC_ID },
      { next: { revalidate: 3600, tags: [SETTINGS_TAG] } }
    );
    return merge(doc);
  } catch (err) {
    console.error("Failed to load settings, using defaults:", err);
    return DEFAULT_SETTINGS;
  }
}

/** Active promo code, or null if the code is unknown/inactive. */
export async function findPromo(code: unknown): Promise<PromoCode | null> {
  if (typeof code !== "string" || !code.trim()) return null;
  const { promoCodes } = await getSettings();
  return promoCodes.find((p) => p.active && p.percent > 0 && p.code === code.trim().toUpperCase()) || null;
}

/** Saves settings and refreshes every page that uses them. Caller must check admin access. */
export async function saveSettings(s: StoreSettings) {
  // Patch (not replace) so fields edited elsewhere, e.g. tagline in Sanity Studio, survive.
  await writeClient.createIfNotExists({ _id: SETTINGS_DOC_ID, _type: "siteSettings", siteName: "ModestStyle.pk" });
  await writeClient
    .patch(SETTINGS_DOC_ID)
    .set({
      announcement: s.announcement,
      supportEmail: s.supportEmail,
      freeShippingThreshold: s.freeShippingThreshold,
      standardShipping: s.standardShipping,
      expressShipping: s.expressShipping,
      codFee: s.codFee,
      popupPromoCode: s.popupPromoCode,
      cartRecoveryCode: s.cartRecoveryCode,
      promoCodes: s.promoCodes.map((p, i) => ({ _key: `promo${i}`, ...p })),
      socialLinks: { instagram: s.instagram, facebook: s.facebook, tiktok: s.tiktok, whatsapp: s.whatsappNumber },
    })
    .commit();
  revalidateTag(SETTINGS_TAG);
}

/** Validates and normalises an admin-submitted settings payload. Returns an error message on failure. */
export function parseSettingsInput(body: Record<string, unknown>): StoreSettings | string {
  const n = (k: string, max: number) => {
    const v = Number(body[k]);
    return Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v) : NaN;
  };
  const amounts = {
    freeShippingThreshold: n("freeShippingThreshold", 1_000_000),
    standardShipping: n("standardShipping", 100_000),
    expressShipping: n("expressShipping", 100_000),
    codFee: n("codFee", 100_000),
  };
  for (const [k, v] of Object.entries(amounts)) {
    if (Number.isNaN(v)) return `Please enter a valid amount for ${k}.`;
  }

  let whatsapp = String(body.whatsappNumber || "").replace(/\D/g, "");
  if (whatsapp.startsWith("0")) whatsapp = "92" + whatsapp.slice(1);
  if (!/^923\d{9}$/.test(whatsapp)) return "WhatsApp number must be a Pakistani mobile, e.g. 03323025239.";

  const promoCodes: PromoCode[] = [];
  for (const raw of (Array.isArray(body.promoCodes) ? body.promoCodes : []) as Record<string, unknown>[]) {
    const code = String(raw?.code || "").trim().toUpperCase();
    if (!code) continue;
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return `Promo code "${code}" may only use letters, numbers, - and _ (3–30 characters).`;
    const percent = Number(raw?.percent);
    if (!Number.isFinite(percent) || percent < 1 || percent > 90) return `Discount for ${code} must be between 1% and 90%.`;
    if (promoCodes.some((p) => p.code === code)) return `Promo code ${code} is listed twice.`;
    promoCodes.push({ code, percent: Math.round(percent), active: raw?.active !== false });
  }

  const s = (k: string, max: number) => String(body[k] ?? "").trim().slice(0, max);
  return {
    announcement: s("announcement", 200),
    whatsappNumber: whatsapp,
    supportEmail: s("supportEmail", 120) || DEFAULT_SETTINGS.supportEmail,
    instagram: s("instagram", 300),
    facebook: s("facebook", 300),
    tiktok: s("tiktok", 300),
    ...amounts,
    popupPromoCode: s("popupPromoCode", 30).toUpperCase(),
    cartRecoveryCode: s("cartRecoveryCode", 30).toUpperCase(),
    promoCodes,
  };
}
