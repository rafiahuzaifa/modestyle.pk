"use client";

import { useSettings } from "@/app/components/SettingsProvider";

/** "@handle" from a profile URL, e.g. https://instagram.com/modestyle.pk → @modestyle.pk */
export function handleFromUrl(url: string) {
  try {
    const part = new URL(url).pathname.split("/").filter(Boolean)[0] || "";
    return part ? `@${part.replace(/^@/, "")}` : "";
  } catch {
    return "";
  }
}

const NETWORKS = [
  { key: "instagram", label: "Instagram", className: "bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white" },
  { key: "facebook", label: "Facebook", className: "bg-[#1877f2] text-white" },
  { key: "tiktok", label: "TikTok", className: "bg-black text-white" },
] as const;

/** Follow buttons for the store's social pages (links come from Admin → Settings). */
export function SocialFollow({
  title = "Follow us for new arrivals & exclusive offers",
  compact = false,
  dark = false,
}: {
  title?: string;
  compact?: boolean;
  dark?: boolean;
}) {
  const settings = useSettings();
  const links = NETWORKS.filter((n) => settings[n.key]);
  if (!links.length) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {title && <p className={`text-sm ${dark ? "text-white/70" : "text-gray-600"}`}>{title}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {links.map((n) => (
          <a
            key={n.key}
            href={settings[n.key]}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-full font-medium transition hover:opacity-90 ${n.className} ${
              compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
            }`}
          >
            Follow on {n.label}
            {!compact && handleFromUrl(settings[n.key]) && (
              <span className="opacity-80 font-normal">{handleFromUrl(settings[n.key])}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
