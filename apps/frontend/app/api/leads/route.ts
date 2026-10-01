import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/neon";
import { requireAdmin } from "@/lib/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL DEFAULT 'unknown',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const sql = await ensureTable();
    await sql`
      INSERT INTO leads (email, source)
      VALUES (${email.toLowerCase().trim()}, ${source || "unknown"})
      ON CONFLICT (email) DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lead capture error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sql = await ensureTable();
    const leads = await sql`SELECT id, email, source, created_at FROM leads ORDER BY created_at DESC LIMIT 500`;
    return NextResponse.json({ leads });
  } catch (err) {
    console.error("List leads error:", err);
    return NextResponse.json({ leads: [] }, { status: 500 });
  }
}
