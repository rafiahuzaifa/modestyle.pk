import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAudience } from "@/lib/marketing";
import { sendBroadcast } from "@/lib/campaigns";
import { isEmailConfigured } from "@/lib/notify";
import { isWhatsAppConfigured } from "@/lib/whatsapp";

export const maxDuration = 60;

/** Audience size and which channels are live. */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const audience = await getAudience();
    return NextResponse.json({
      email: audience.filter((a) => a.email_opt_in && a.email).length,
      whatsapp: audience.filter((a) => a.whatsapp_opt_in && a.phone).length,
      emailReady: isEmailConfigured(),
      whatsappReady: isWhatsAppConfigured(),
    });
  } catch (err) {
    console.error("Broadcast stats error:", err);
    return NextResponse.json({ error: "Failed to load audience" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const subject = String(body.subject || "").trim().slice(0, 150);
    const message = String(body.message || "").trim().slice(0, 900);
    const code = String(body.code || "").trim().toUpperCase().slice(0, 30) || undefined;
    const channels = { email: body.email === true, whatsapp: body.whatsapp === true };
    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }
    if (!channels.email && !channels.whatsapp) {
      return NextResponse.json({ error: "Choose at least one channel" }, { status: 400 });
    }
    return NextResponse.json(await sendBroadcast({ subject, message, code, channels }));
  } catch (err) {
    console.error("Broadcast error:", err);
    return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 });
  }
}
