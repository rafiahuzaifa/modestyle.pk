import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS — same "MS" monogram as app/icon.svg. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1A1A",
          color: "#C6A45C",
          fontSize: 84,
          fontWeight: 700,
          fontFamily: "Georgia, serif",
          letterSpacing: -2,
        }}
      >
        MS
      </div>
    ),
    size
  );
}
