-- 1. TABEL KATEGORI (CATEGORIES)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    store_name TEXT DEFAULT 'Soodap Resto',
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL MENU & PRODUK (PRODUCTS)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    store_name TEXT DEFAULT 'Soodap Resto',
    name TEXT NOT NULL,
    category TEXT,
    selling_price NUMERIC DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    track_stock BOOLEAN DEFAULT FALSE,
    description TEXT,
    recipe_note TEXT,
    image_uri TEXT,
    icon_name TEXT,
    color_hex TEXT,
    has_variants BOOLEAN DEFAULT FALSE,
    variants JSONB,
    modifier_groups JSONB,
    available_outlets JSONB,
    hidden_outlets JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL TRANSAKSI (TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    store_name TEXT DEFAULT 'Soodap Resto',
    order_type TEXT,
    customer_name TEXT,
    items JSONB,
    subtotal NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    payment_method TEXT,
    status TEXT,
    cashier_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL DISKON & PROMO (DISCOUNTS)
CREATE TABLE IF NOT EXISTS public.discounts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    store_name TEXT DEFAULT 'Soodap Resto',
    code TEXT,
    name TEXT NOT NULL,
    scope TEXT DEFAULT 'global_coupon',
    type TEXT DEFAULT 'percentage',
    value NUMERIC DEFAULT 0,
    min_purchase NUMERIC DEFAULT 0,
    max_discount NUMERIC DEFAULT 0,
    applied_product_ids JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL OUTLET / CABANG (OUTLETS)
CREATE TABLE IF NOT EXISTS public.outlets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS) & IZIN AKSES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on categories') THEN
    CREATE POLICY "Allow public access on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on products') THEN
    CREATE POLICY "Allow public access on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on transactions') THEN
    CREATE POLICY "Allow public access on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on discounts') THEN
    CREATE POLICY "Allow public access on discounts" ON public.discounts FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on outlets') THEN
    CREATE POLICY "Allow public access on outlets" ON public.outlets FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
