// Generates the PWA icons in public/icons from the "MS" brand monogram.
// Run: node scripts/generate-pwa-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";

const GOLD = "#C6A45C";
const DARK = "#1A1A1A";

/** Regular icon: rounded tile with a thin gold border (shown as-is by most launchers). */
const regular = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${DARK}"/>
  <rect x="32" y="32" width="448" height="448" rx="88" fill="none" stroke="${GOLD}" stroke-width="10" opacity="0.6"/>
  <text x="256" y="338" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="232" font-weight="700" fill="${GOLD}">MS</text>
</svg>`;

/** Maskable icon: full-bleed background, artwork inside the central 80% safe zone. */
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${DARK}"/>
  <text x="256" y="318" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="176" font-weight="700" fill="${GOLD}">MS</text>
</svg>`;

mkdirSync("public/icons", { recursive: true });
const jobs = [
  [regular, 192, "icon-192.png"],
  [regular, 512, "icon-512.png"],
  [maskable, 192, "icon-maskable-192.png"],
  [maskable, 512, "icon-maskable-512.png"],
];
for (const [svg, size, name] of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(`public/icons/${name}`);
  console.log("wrote public/icons/" + name);
}
