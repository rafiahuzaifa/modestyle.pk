import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Webhook endpoint — forwards gateway callbacks to the FastAPI backend.
 * Safepay, JazzCash, and EasyPaisa all POST status updates here.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const gateway = request.nextUrl.searchParams.get("gateway") || "unknown";

    const res = await fetch(`${API_URL}/api/payment/webhook/${gateway}`, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") || "application/json",
      },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
