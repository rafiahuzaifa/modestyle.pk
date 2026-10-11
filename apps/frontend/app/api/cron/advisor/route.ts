import { NextRequest, NextResponse } from "next/server";
import { runAdvisor } from "@/lib/agent/advisor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Daily store review (Vercel Cron, see vercel.json). */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await runAdvisor();
    return NextResponse.json({ suggestions: report.suggestions.length });
  } catch (err) {
    console.error("Advisor cron failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
