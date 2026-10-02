import { NextRequest, NextResponse } from "next/server";
import { sendCartReminders } from "@/lib/campaigns";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Triggered by Vercel Cron (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await sendCartReminders());
  } catch (err) {
    console.error("Cart reminder cron failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
