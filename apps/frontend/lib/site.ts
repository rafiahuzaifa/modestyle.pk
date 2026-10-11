/** Public site URL used for canonical links, sitemap and emails.
 * NEXT_PUBLIC_SITE_URL wins; otherwise Vercel's production domain (custom domain once
 * one is attached), so canonicals never point at a domain this site doesn't serve. */
const vercelHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "ModestStyle.pk";

// WhatsApp number, support email, shipping fees etc. are admin-managed:
// see lib/settings.ts (server) and useSettings() (client).
