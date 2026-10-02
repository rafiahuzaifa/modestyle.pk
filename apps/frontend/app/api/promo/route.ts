import { NextRequest, NextResponse } from "next/server";
import { findPromo } from "@/lib/settings";

/** Checks a promo code without exposing the list of codes. */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const promo = await findPromo(code);
    if (!promo) return NextResponse.json({ valid: false, error: "Invalid promo code" }, { status: 404 });
    return NextResponse.json({ valid: true, code: promo.code, percent: promo.percent });
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid promo code" }, { status: 400 });
  }
}
