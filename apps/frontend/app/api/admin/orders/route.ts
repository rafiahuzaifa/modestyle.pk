import { NextResponse } from "next/server";
import { getDb } from "@/lib/neon";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        o.id, o.customer_name, o.customer_email, o.customer_phone,
        o.total, o.status, o.payment_method, o.payment_status,
        o.transaction_id, o.created_at,
        COUNT(oi.id)::int AS items_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 200
    `;
    return NextResponse.json({ orders: rows });
  } catch (err) {
    console.error("Admin orders error:", err);
    return NextResponse.json({ orders: [] }, { status: 500 });
  }
}
