import { NextResponse } from "next/server";
import { availablePaymentMethods } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(availablePaymentMethods());
}
