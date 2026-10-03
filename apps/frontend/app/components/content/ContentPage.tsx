import Link from "next/link";
import { getPage } from "@/lib/pages";
import { getSettings } from "@/lib/settings";
import { formatPkr, formatWhatsApp } from "@/lib/settings-shared";
import { fillTokens, type Block, type PageSlug, type TableValue, type TokenValues } from "@/lib/content-pages";
import { FaqAccordion } from "./FaqAccordion";

const TONE: Record<string, { box: string; heading: string; text: string; bullet: string }> = {
  default: { box: "", heading: "text-secondary", text: "text-gray-500", bullet: "text-gold-400" },
  gold: { box: "bg-gold-50 border border-gold-100 rounded-xl p-6", heading: "text-gold-800", text: "text-gold-700", bullet: "text-gold-500" },
  good: { box: "bg-green-50 border border-green-100 rounded-xl p-6", heading: "text-green-700", text: "text-green-700", bullet: "text-green-500" },
  bad: { box: "bg-red-50 border border-red-100 rounded-xl p-6", heading: "text-red-700", text: "text-red-600", bullet: "text-red-400" },
  amber: { box: "bg-amber-50 border border-amber-200 rounded-xl p-6", heading: "text-amber-800", text: "text-amber-700", bullet: "text-amber-500" },
};

const str = (v: unknown) => (typeof v === "string" ? v : "");
const arr = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);

function Heading({ eyebrow, heading, center }: { eyebrow?: string; heading?: string; center?: boolean }) {
  if (!eyebrow && !heading) return null;
  return (
    <div className={`mb-5 ${center ? "text-center" : ""}`}>
      {eyebrow && <p className="text-gold-500 text-xs tracking-[0.3em] uppercase mb-2">{eyebrow}</p>}
      {heading && <h2 className="font-display text-2xl text-secondary">{heading}</h2>}
    </div>
  );
}

function renderBlock(b: Block, i: number, t: (s: string) => string, fees: { standard: number; express: number; free: number; cod: number }) {
  const heading = t(str(b.heading));
  const eyebrow = t(str(b.eyebrow));
  switch (b.type) {
    case "text":
      return (
        <div key={i}>
          <Heading eyebrow={eyebrow} heading={heading} />
          <div className="space-y-4 text-sm text-gray-500 leading-relaxed">
            {t(str(b.body))
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((p, j) => (
                <p key={j} className="whitespace-pre-line">{p}</p>
              ))}
          </div>
        </div>
      );
    case "list": {
      const tone = TONE[str(b.tone)] || TONE.default;
      return (
        <div key={i} className={tone.box}>
          {heading && <h2 className={`font-display text-xl mb-3 ${tone.heading}`}>{heading}</h2>}
          <ul className="space-y-2">
            {arr<string>(b.items).map((item, j) => (
              <li key={j} className={`flex gap-2 text-sm leading-relaxed ${tone.text}`}>
                <span className={`shrink-0 ${tone.bullet}`}>•</span>
                <span>{t(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "cards": {
      const items = arr<{ icon?: string; title?: string; text?: string }>(b.items);
      const cols = items.length >= 4 ? "sm:grid-cols-2 md:grid-cols-4" : "sm:grid-cols-3";
      return (
        <div key={i}>
          <Heading eyebrow={eyebrow} heading={heading} />
          <div className={`grid ${cols} gap-4`}>
            {items.map((c, j) => (
              <div key={j} className="bg-gray-50 rounded-xl p-5 text-center">
                {c.icon && <div className="text-3xl mb-2">{c.icon}</div>}
                <p className="font-medium text-secondary text-sm">{t(str(c.title))}</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">{t(str(c.text))}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "steps":
      return (
        <div key={i}>
          <Heading heading={heading} />
          <div className="space-y-3">
            {arr<{ title?: string; text?: string }>(b.items).map((s, j) => (
              <div key={j} className="flex gap-4 p-5 bg-gray-50 rounded-xl">
                <span className="text-2xl font-display text-gold-400 w-10 shrink-0">{String(j + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium text-secondary text-sm">{t(str(s.title))}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{t(str(s.text))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "table": {
      const table = (b.table || { columns: [], rows: [] }) as TableValue;
      return (
        <div key={i}>
          <Heading heading={heading} />
          <div className="border border-gray-100 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-white">
                <tr>
                  {table.columns.map((c, j) => (
                    <th key={j} className="text-left px-5 py-3 text-xs uppercase font-medium">{t(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {table.rows.map((r, j) => (
                  <tr key={j} className="hover:bg-gray-50">
                    {table.columns.map((_, k) => (
                      <td key={k} className={`px-5 py-3.5 ${k === 0 ? "font-medium text-gray-800" : "text-gray-600"}`}>{t(r[k] || "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {str(b.note) && <p className="text-xs text-gray-400 mt-3">{t(str(b.note))}</p>}
        </div>
      );
    }
    case "stats":
      return (
        <div key={i} className="bg-secondary text-white rounded-2xl py-12 px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {arr<{ value?: string; label?: string }>(b.items).map((s, j) => (
              <div key={j}>
                <p className="font-display text-3xl text-gold-400 mb-1">{t(str(s.value))}</p>
                <p className="text-white/60 text-xs">{t(str(s.label))}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "callout": {
      const tone = TONE[str(b.tone)] || TONE.gold;
      return (
        <div key={i} className={tone.box || TONE.gold.box}>
          {heading && <p className={`font-semibold mb-2 ${tone.heading}`}>{heading}</p>}
          <p className={`text-sm leading-relaxed whitespace-pre-line ${tone.text}`}>{t(str(b.body))}</p>
        </div>
      );
    }
    case "faq":
      return (
        <div key={i}>
          {heading && <h2 className="font-display text-xl text-secondary mb-3">{heading}</h2>}
          <FaqAccordion items={arr<{ q?: string; a?: string }>(b.items).map((f) => ({ q: t(str(f.q)), a: t(str(f.a)) }))} />
        </div>
      );
    case "shippingFees":
      return (
        <div key={i}>
          <Heading heading={heading} />
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order / Option</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="px-6 py-4 text-gray-700">Standard delivery — orders under {formatPkr(fees.free)}</td>
                  <td className="px-6 py-4 text-gray-700">{formatPkr(fees.standard)}</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="px-6 py-4 text-green-700 font-medium">Standard delivery — {formatPkr(fees.free)} &amp; above</td>
                  <td className="px-6 py-4 text-green-700 font-semibold">FREE 🎉</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Express delivery</td>
                  <td className="px-6 py-4 text-gray-700">{formatPkr(fees.express)}</td>
                </tr>
                {fees.cod > 0 && (
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Cash on Delivery fee</td>
                    <td className="px-6 py-4 text-gray-700">{formatPkr(fees.cod)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    case "cta": {
      const href = str(b.href) || "/products";
      return (
        <div key={i} className="text-center py-6">
          {heading && <h2 className="font-display text-3xl text-secondary mb-3">{heading}</h2>}
          {str(b.body) && <p className="text-gray-500 text-sm mb-6">{t(str(b.body))}</p>}
          {str(b.buttonLabel) && (
            <Link href={href} className="inline-block bg-secondary text-white px-10 py-3.5 rounded-lg text-sm font-medium hover:bg-secondary/90 transition">
              {t(str(b.buttonLabel))}
            </Link>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}

/** Renders an admin-editable content page (hero + blocks), filling settings tokens. */
export async function ContentPage({ slug }: { slug: PageSlug }) {
  const [{ page }, s] = await Promise.all([getPage(slug), getSettings()]);
  const tokens: TokenValues = {
    whatsapp: formatWhatsApp(s.whatsappNumber),
    email: s.supportEmail,
    freeShipping: formatPkr(s.freeShippingThreshold),
    standardShipping: formatPkr(s.standardShipping),
    expressShipping: formatPkr(s.expressShipping),
    codFee: formatPkr(s.codFee),
  };
  const t = (text: string) => fillTokens(text, tokens);
  const fees = { standard: s.standardShipping, express: s.expressShipping, free: s.freeShippingThreshold, cod: s.codFee };

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-secondary text-white py-20 text-center px-4">
        {page.eyebrow && <p className="text-gold-400 text-xs tracking-[0.3em] uppercase mb-4">{t(page.eyebrow)}</p>}
        <h1 className="font-display text-4xl md:text-5xl mb-3">{t(page.title)}</h1>
        {page.subtitle && <p className="text-white/60 text-sm max-w-xl mx-auto leading-relaxed">{t(page.subtitle)}</p>}
      </section>
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-12">{page.blocks.map((b, i) => renderBlock(b, i, t, fees))}</div>
      </section>
    </main>
  );
}

export async function contentPageMetadata(slug: PageSlug) {
  const { page } = await getPage(slug);
  return { title: page.title, description: page.subtitle || undefined };
}
