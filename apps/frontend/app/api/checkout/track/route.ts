import { NextRequest, NextResponse } from "next/server";
import { trackCheckout, upsertSubscriber } from "@/lib/marketing";
import { isValidEmail, normalizePkPhone } from "@/lib/orders";

/** Records the shopper's details + bag after the checkout info step, so we can
 * send a reminder/offer if they leave without ordering (only when they opted in). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.checkout_id === "string" ? body.checkout_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid checkout id" }, { status: 400 });
    }
    const phone = normalizePkPhone(body.phone);
    const email = isValidEmail(body.email) ? String(body.email).trim().toLowerCase() : undefined;
    if (!phone && !email) return NextResponse.json({ ok: true });

    const items = Array.isArray(body.items)
      ? body.items.slice(0, 50).map((i: { name?: unknown; quantity?: unknown; price?: unknown }) => ({
          name: String(i?.name ?? "").slice(0, 200),
          quantity: Number(i?.quantity) || 1,
          price: Number(i?.price) || 0,
        }))
      : [];

    await trackCheckout({
      id,
      name: typeof body.name === "string" ? body.name.slice(0, 200) : undefined,
      email,
      phone: phone || undefined,
      items,
      subtotal: Number(body.subtotal) || 0,
      optIn: body.opt_in === true,
    });
    if (body.opt_in === true) {
      await upsertSubscriber({
        name: typeof body.name === "string" ? body.name.slice(0, 200) : undefined,
        email,
        phone: phone || undefined,
        source: "checkout",
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Checkout track error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
