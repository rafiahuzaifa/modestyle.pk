import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/marketing";
import { SITE_NAME, SITE_URL } from "@/lib/site";

function page(message: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${SITE_NAME}</title></head>
<body style="font-family:Georgia,serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#fff;color:#1f1f1f">
<div style="text-align:center;padding:24px;max-width:420px"><p style="font-size:22px">${message}</p>
<p><a href="${SITE_URL}" style="color:#b8964e">Back to ${SITE_NAME}</a></p></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function handle(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  try {
    const ok = await unsubscribeByToken(token);
    return page(ok ? "You've been unsubscribed. You won't receive offers from us anymore." : "This unsubscribe link is invalid or has expired.");
  } catch {
    return page("Something went wrong. Please try again later.");
  }
}

export const GET = handle;
// One-click unsubscribe (RFC 8058) from email clients.
export const POST = handle;
