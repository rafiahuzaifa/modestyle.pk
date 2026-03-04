import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://backend-sooty-two-73.vercel.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/api/payment/easypaisa/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.detail || data.error || "";
      if (msg.toLowerCase().includes("not configured")) {
        return NextResponse.json(
          { error: "EasyPaisa payment is being set up. Please use Cash on Delivery for now." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: msg || "EasyPaisa payment failed" }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "EasyPaisa unavailable. Please use Cash on Delivery or WhatsApp us." },
      { status: 500 }
    );
  }
}
