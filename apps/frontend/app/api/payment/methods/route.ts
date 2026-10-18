import { NextResponse } from "next/server";
import { availablePaymentMethods } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { transferAvailable } from "@/lib/settings-shared";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ...availablePaymentMethods(), transfer: transferAvailable(await getSettings()) });
}
