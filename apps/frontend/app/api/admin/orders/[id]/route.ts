import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/neon";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const sql = getDb();
    await sql`
      UPDATE orders SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update order error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
