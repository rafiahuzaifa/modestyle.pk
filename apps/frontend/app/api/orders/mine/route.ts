import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/neon";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    const sql = getDb();

    const rows = email
      ? await sql`
          SELECT o.id, o.total, o.status, o.created_at,
            COUNT(oi.id)::int AS items_count
          FROM orders o
          LEFT JOIN order_items oi ON oi.order_id = o.id
          WHERE o.customer_email = ${email}
          GROUP BY o.id
          ORDER BY o.created_at DESC
          LIMIT 50
        `
      : [];

    return NextResponse.json({ orders: rows });
  } catch (err) {
    console.error("Orders mine error:", err);
    return NextResponse.json({ orders: [] }, { status: 500 });
  }
}
