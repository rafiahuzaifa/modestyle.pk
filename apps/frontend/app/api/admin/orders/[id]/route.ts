import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/neon";
import { requireAdmin } from "@/lib/admin";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const sql = getDb();

    // Admin confirms an advance (bank / wallet) transfer has arrived.
    if (body.payment === "received") {
      const [paid] = await sql`
        UPDATE orders SET
          payment_status = 'paid',
          status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
          confirmed_at = CASE WHEN status = 'pending' THEN NOW() ELSE confirmed_at END,
          updated_at = NOW()
        WHERE id = ${id} AND payment_method = 'transfer'
        RETURNING status, payment_status
      `;
      if (!paid) return NextResponse.json({ error: "Only bank/wallet transfer orders can be marked as paid here" }, { status: 400 });
      return NextResponse.json({ success: true, ...paid });
    }

    const { status } = body;
    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    // A delivered COD order means the rider collected the cash.
    const [order] = await sql`
      UPDATE orders SET
        status = ${status},
        payment_status = CASE
          WHEN payment_method = 'cod' AND ${status} = 'delivered' THEN 'paid'
          ELSE payment_status
        END,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING status, payment_status
    `;
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, ...order });
  } catch (err) {
    console.error("Update order error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const sql = getDb();
    const [order] = await sql`
      SELECT o.*,
        json_agg(json_build_object(
          'id', oi.id, 'name', oi.name, 'price', oi.price,
          'quantity', oi.quantity, 'size', oi.size, 'color', oi.color
        )) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ${id}
      GROUP BY o.id
    `;
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    console.error("Get order error:", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
