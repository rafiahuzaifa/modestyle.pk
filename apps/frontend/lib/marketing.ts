import { getDb } from "@/lib/neon";

let schemaReady: Promise<void> | null = null;

/** Creates the marketing tables/columns on first use (idempotent, additive only). */
export function ensureMarketingSchema() {
  schemaReady ??= (async () => {
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        email_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
        whatsapp_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
        source TEXT NOT NULL DEFAULT 'unknown',
        unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS checkouts (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        items JSONB NOT NULL DEFAULT '[]',
        subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
        opt_in BOOLEAN NOT NULL DEFAULT FALSE,
        order_id TEXT,
        reminder_sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`;
    // Popup/newsletter leads are email subscribers too.
    await sql`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
          INSERT INTO subscribers (email, whatsapp_opt_in, source)
          SELECT LOWER(email), FALSE, source FROM leads
          ON CONFLICT (email) DO NOTHING;
        END IF;
      END $$
    `;
  })().catch((err) => {
    schemaReady = null;
    throw err;
  });
  return schemaReady;
}

export interface SubscriberInput {
  name?: string;
  email?: string;
  phone?: string;
  source: string;
  whatsapp?: boolean;
}

/** Adds or refreshes a subscriber, matched by phone or email. Re-opting in re-enables both channels. */
export async function upsertSubscriber(input: SubscriberInput) {
  await ensureMarketingSchema();
  const sql = getDb();
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone || null;
  if (!email && !phone) return;
  const whatsapp = input.whatsapp ?? !!phone;

  const [existing] = await sql`
    SELECT id FROM subscribers
    WHERE (${phone}::text IS NOT NULL AND phone = ${phone})
       OR (${email}::text IS NOT NULL AND email = ${email})
    LIMIT 1
  `;
  if (existing) {
    await sql`
      UPDATE subscribers SET
        name = COALESCE(${input.name || null}, name),
        email_opt_in = TRUE,
        whatsapp_opt_in = whatsapp_opt_in OR ${whatsapp},
        updated_at = NOW()
      WHERE id = ${existing.id}
    `;
    // Fill in a missing email/phone, unless another subscriber row already owns it.
    if (email) {
      await sql`
        UPDATE subscribers SET email = ${email}
        WHERE id = ${existing.id} AND email IS NULL
          AND NOT EXISTS (SELECT 1 FROM subscribers WHERE email = ${email})
      `;
    }
    if (phone) {
      await sql`
        UPDATE subscribers SET phone = ${phone}
        WHERE id = ${existing.id} AND phone IS NULL
          AND NOT EXISTS (SELECT 1 FROM subscribers WHERE phone = ${phone})
      `;
    }
  } else {
    await sql`
      INSERT INTO subscribers (name, email, phone, whatsapp_opt_in, source)
      VALUES (${input.name || null}, ${email}, ${phone}, ${whatsapp}, ${input.source})
      ON CONFLICT DO NOTHING
    `;
  }
}

export interface CheckoutSnapshot {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  items: { name: string; quantity: number; price?: number }[];
  subtotal: number;
  optIn: boolean;
}

/** Saves the shopper's contact + bag as soon as they finish the info step, for cart recovery. */
export async function trackCheckout(c: CheckoutSnapshot) {
  await ensureMarketingSchema();
  const sql = getDb();
  await sql`
    INSERT INTO checkouts (id, name, email, phone, items, subtotal, opt_in)
    VALUES (${c.id}, ${c.name || null}, ${c.email || null}, ${c.phone || null},
            ${JSON.stringify(c.items)}, ${c.subtotal}, ${c.optIn})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
      items = EXCLUDED.items, subtotal = EXCLUDED.subtotal, opt_in = EXCLUDED.opt_in,
      updated_at = NOW()
    WHERE checkouts.order_id IS NULL
  `;
}

/** Closes any open checkout for this shopper so they don't get a "you left something" message. */
export async function markCheckoutRecovered(orderId: string, checkoutId: string | undefined, phone: string, email: string) {
  await ensureMarketingSchema();
  const sql = getDb();
  await sql`
    UPDATE checkouts SET order_id = ${orderId}, updated_at = NOW()
    WHERE order_id IS NULL
      AND (id = ${checkoutId || ""} OR phone = ${phone} OR LOWER(email) = LOWER(${email}))
  `;
}

export interface AbandonedCheckout {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  subtotal: number;
}

/** Opted-in checkouts idle for at least `minMinutes`, not older than `maxHours`, never reminded. */
export async function claimAbandonedCheckouts(minMinutes: number, maxHours: number, limit = 50) {
  await ensureMarketingSchema();
  const sql = getDb();
  // Claim rows atomically so overlapping cron runs never message the same shopper twice.
  return (await sql`
    UPDATE checkouts SET reminder_sent_at = NOW()
    WHERE id IN (
      SELECT c.id FROM checkouts c
      WHERE c.order_id IS NULL
        AND c.reminder_sent_at IS NULL
        AND c.opt_in = TRUE
        AND c.updated_at < NOW() - make_interval(mins => ${minMinutes})
        AND c.updated_at > NOW() - make_interval(hours => ${maxHours})
        AND NOT EXISTS (
          SELECT 1 FROM orders o
          WHERE o.created_at > c.created_at
            AND (o.customer_phone = c.phone OR LOWER(o.customer_email) = LOWER(c.email))
        )
      ORDER BY c.updated_at
      LIMIT ${limit}
    )
    RETURNING id, name, email, phone, subtotal
  `) as AbandonedCheckout[];
}

export interface Subscriber {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  email_opt_in: boolean;
  whatsapp_opt_in: boolean;
  unsubscribe_token: string;
}

export async function getUnsubscribeToken(email: string | null, phone: string | null) {
  await ensureMarketingSchema();
  const sql = getDb();
  const [row] = await sql`
    SELECT unsubscribe_token FROM subscribers
    WHERE (${phone}::text IS NOT NULL AND phone = ${phone}) OR (${email}::text IS NOT NULL AND email = LOWER(${email}))
    LIMIT 1
  `;
  return (row?.unsubscribe_token as string | undefined) || null;
}

export async function getAudience() {
  await ensureMarketingSchema();
  const sql = getDb();
  return (await sql`
    SELECT id, name, email, phone, email_opt_in, whatsapp_opt_in, unsubscribe_token
    FROM subscribers
    WHERE (email_opt_in AND email IS NOT NULL) OR (whatsapp_opt_in AND phone IS NOT NULL)
    ORDER BY created_at DESC
  `) as Subscriber[];
}

export async function unsubscribeByToken(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false;
  await ensureMarketingSchema();
  const sql = getDb();
  const rows = await sql`
    UPDATE subscribers SET email_opt_in = FALSE, whatsapp_opt_in = FALSE, updated_at = NOW()
    WHERE unsubscribe_token = ${token} RETURNING id
  `;
  return rows.length > 0;
}

export async function unsubscribeWhatsApp(phone: string) {
  await ensureMarketingSchema();
  const sql = getDb();
  await sql`UPDATE subscribers SET whatsapp_opt_in = FALSE, updated_at = NOW() WHERE phone = ${phone}`;
  await sql`UPDATE checkouts SET opt_in = FALSE WHERE phone = ${phone} AND order_id IS NULL`;
}

/** Customer tapped "Confirm Order" on WhatsApp. Only the phone the order was placed with can confirm it. */
export async function confirmOrderFromWhatsApp(orderId: string, phone: string) {
  await ensureMarketingSchema();
  const sql = getDb();
  const rows = await sql`
    UPDATE orders SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
    WHERE id = ${orderId} AND customer_phone = ${phone} AND status = 'pending'
    RETURNING id, customer_name, total
  `;
  return rows[0] as { id: string; customer_name: string; total: number } | undefined;
}

export async function cancelOrderFromWhatsApp(orderId: string, phone: string) {
  const sql = getDb();
  const rows = await sql`
    UPDATE orders SET status = 'cancelled', updated_at = NOW()
    WHERE id = ${orderId} AND customer_phone = ${phone} AND status = 'pending'
    RETURNING id
  `;
  return rows[0] as { id: string } | undefined;
}
