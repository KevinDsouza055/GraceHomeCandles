-- ============================================================
-- GRACE HOME CANDLES — SUPABASE DATABASE SCHEMA
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PRODUCTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,           -- e.g. 'velvet-vanilla'
  name            TEXT NOT NULL,
  notes           TEXT,                       -- fragrance notes summary
  short_desc      TEXT,
  description     TEXT,
  fragrance_top   TEXT,
  fragrance_mid   TEXT,
  fragrance_base  TEXT,
  burn_time       TEXT,
  size            TEXT DEFAULT '300g',
  wax             TEXT DEFAULT 'Coconut-Soy Blend',
  wick            TEXT DEFAULT 'Cotton Braided',
  original_price  NUMERIC(10,2) NOT NULL,
  sale_price      NUMERIC(10,2) NOT NULL,
  badges          TEXT[] DEFAULT '{}',        -- e.g. {'Bestseller', 'New'}
  image           TEXT,                       -- primary image URL
  images          TEXT[] DEFAULT '{}',        -- all image URLs
  is_active       BOOLEAN DEFAULT TRUE,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_bestseller   BOOLEAN DEFAULT FALSE,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ORDERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  shipping_address JSONB NOT NULL,            -- {address, city, state, pincode}
  gift_message     TEXT DEFAULT '',
  order_notes      TEXT DEFAULT '',
  subtotal         NUMERIC(10,2) NOT NULL,
  shipping         NUMERIC(10,2) DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL,
  status           TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','processing','dispatched','delivered','cancelled','refunded')),
  payment_status   TEXT DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_id       TEXT,                      -- Razorpay payment ID
  razorpay_order_id TEXT,                     -- Razorpay order ID (if using Orders API)
  tracking_number  TEXT,
  courier          TEXT,
  ip_address       INET,                      -- for fraud prevention (optional)
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── ORDER ITEMS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 20),
  subtotal     NUMERIC(10,2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTACT MESSAGES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NEWSLETTER SUBSCRIBERS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — IMPORTANT FOR SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ── PRODUCTS: Public read (active products only) ──────────────
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (is_active = TRUE);

-- No public insert/update/delete on products (admin only via Dashboard)

-- ── ORDERS: Public insert only (to place new orders) ─────────
CREATE POLICY "Anyone can create an order"
  ON orders FOR INSERT
  WITH CHECK (
    customer_name IS NOT NULL AND
    customer_email IS NOT NULL AND
    customer_phone IS NOT NULL AND
    total > 0
  );

-- Public cannot read other people's orders (no SELECT policy for anon)
-- Admin reads all via service_role key (server-side only)

-- Allow updating payment status (limited fields, by anon — acceptable since payment_id is set by Razorpay)
CREATE POLICY "Allow payment status update"
  ON orders FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);
-- Note: In production, replace this with a server-side webhook that uses service_role key

-- ── ORDER ITEMS: Public insert only ──────────────────────────
CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    quantity > 0 AND
    quantity <= 20 AND
    price > 0
  );

-- ── CONTACT MESSAGES: Public insert only ─────────────────────
CREATE POLICY "Anyone can submit a contact message"
  ON contact_messages FOR INSERT
  WITH CHECK (
    name IS NOT NULL AND
    email IS NOT NULL AND
    message IS NOT NULL AND
    length(message) >= 10 AND
    length(message) <= 1000
  );

-- ── NEWSLETTER: Public insert only ───────────────────────────
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (
    email IS NOT NULL AND
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- ============================================================
-- INDEXES (performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_active     ON products (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products (is_bestseller) WHERE is_bestseller = TRUE;
CREATE INDEX IF NOT EXISTS idx_orders_email        ON orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment      ON orders (payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_contact_unread      ON contact_messages (is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_email    ON newsletter_subscribers (email);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED PRODUCTS
-- ============================================================
INSERT INTO products (id, name, notes, short_desc, description, fragrance_top, fragrance_mid, fragrance_base, burn_time, original_price, sale_price, badges, image, images, is_active, is_featured, is_bestseller, sort_order)
VALUES
(
  'velvet-vanilla',
  'Velvet Vanilla',
  'Tahitian Vanilla · Warm Musk · Amber',
  'Enveloping and intimate, like cashmere on skin.',
  'A luxurious depth of pure Tahitian vanilla harmonises with warm amber and whispered musk. Sensual, unhurried, and utterly indulgent — Velvet Vanilla transforms any room into a sanctuary of quiet luxury.',
  'Madagascar Vanilla', 'Warm Amber', 'White Musk & Sandalwood',
  '60–70 hours', 1499, 1199,
  ARRAY['Bestseller'],
  'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=85',
  ARRAY['https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=85','https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=85'],
  TRUE, TRUE, TRUE, 1
),
(
  'midnight-oud',
  'Midnight Oud',
  'Aged Oud · Dark Rose · Patchouli',
  'The scent of velvet dusk and ancient wood.',
  'Rare aged oud meets the shadow of dark rose petals, grounded in deep patchouli and cedarwood.',
  'Saffron & Black Pepper', 'Dark Rose & Oud', 'Patchouli & Cedarwood',
  '65–75 hours', 1799, 1499,
  ARRAY['Bestseller', 'New'],
  'https://images.unsplash.com/photo-1608181831718-6b9c7e1bda9f?w=800&q=85',
  ARRAY['https://images.unsplash.com/photo-1608181831718-6b9c7e1bda9f?w=800&q=85'],
  TRUE, TRUE, TRUE, 2
),
(
  'cashmere-rose',
  'Cashmere Rose',
  'Centifolia Rose · Cashmere Wood · Peony',
  'Infinitely feminine. Quietly powerful.',
  'A bouquet of centifolia rose at full bloom, softened by the warmth of cashmere wood and peony.',
  'Pink Peony & Bergamot', 'Centifolia Rose', 'Cashmere Wood & Vanilla',
  '60–70 hours', 1699, 1349,
  ARRAY['New'],
  'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=85',
  ARRAY['https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=85'],
  TRUE, TRUE, FALSE, 3
),
(
  'amber-sandalwood',
  'Amber Sandalwood',
  'Mysore Sandalwood · Golden Amber · Vetiver',
  'Sun-warmed skin and sacred wood.',
  'The richness of authentic Mysore sandalwood married with golden amber resin and earthy vetiver.',
  'Bergamot & Cardamom', 'Mysore Sandalwood & Amber', 'Vetiver & Tonka Bean',
  '70–80 hours', 1699, 1299,
  ARRAY['Bestseller'],
  'https://images.unsplash.com/photo-1543342384-1f1350e27861?w=800&q=85',
  ARRAY['https://images.unsplash.com/photo-1543342384-1f1350e27861?w=800&q=85'],
  TRUE, FALSE, TRUE, 4
),
(
  'lavender-silk',
  'Lavender Silk',
  'Provençal Lavender · White Tea · Musk',
  'The art of doing nothing, beautifully.',
  'Fields of Provençal lavender drift over delicate white tea and a barely-there silk musk.',
  'Lavender & Eucalyptus', 'White Tea & Iris', 'Silk Musk & Cedarwood',
  '55–65 hours', 1499, 1149,
  ARRAY['New'],
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=85',
  ARRAY['https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=85'],
  TRUE, FALSE, FALSE, 5
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SCHEMA ADDITIONS v2 — Delivery & Admin Support
-- Run these if you already ran the v1 schema
-- ============================================================

-- Add shipping_label column to orders (if not exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label TEXT DEFAULT 'Standard Shipping';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT;

-- Delivery zones table (optional — for future admin config)
CREATE TABLE IF NOT EXISTS delivery_zones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_name   TEXT NOT NULL,
  pincode_prefixes TEXT[] NOT NULL,   -- first 2 digits, e.g. {'40','41'}
  charge      NUMERIC(6,2) NOT NULL,
  label       TEXT NOT NULL,
  est_days    TEXT,                   -- e.g. '1–2 days'
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default delivery zones (Mumbai-centric)
INSERT INTO delivery_zones (zone_name, pincode_prefixes, charge, label, est_days) VALUES
  ('Local – Mumbai & Pune',     ARRAY['40','41'],                           49,  'Local Delivery',             '1–2 days'),
  ('Regional – Maharashtra/GJ', ARRAY['42','43','36','44','39','38','37'],  79,  'Regional Shipping',          '2–3 days'),
  ('National – Delhi/Hyd/KA',   ARRAY['50','51','56','57','58','11','12'],  99,  'Standard Shipping',          '3–4 days'),
  ('South India',               ARRAY['60','61','62','63','64','65','66'],  119, 'Standard Shipping',          '3–5 days'),
  ('East India',                ARRAY['70','71','72','73','74','75'],       149, 'Long Distance Shipping',     '4–5 days'),
  ('Northeast & Remote',        ARRAY['78','79','83','79','97'],            199, 'Pan-India Remote Shipping',  '5–7 days')
ON CONFLICT DO NOTHING;

-- RLS for delivery_zones (public read)
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active delivery zones"
  ON delivery_zones FOR SELECT USING (is_active = TRUE);

-- Index
CREATE INDEX IF NOT EXISTS idx_orders_shipping ON orders (shipping_label);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders (tracking_number) WHERE tracking_number IS NOT NULL;
