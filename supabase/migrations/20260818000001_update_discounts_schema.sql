-- MIGRATION: Update schema public.discounts dengan kolom fitur promo baru
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT 'Soodap Resto';
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'global_coupon';
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS max_discount NUMERIC DEFAULT 0;
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS applied_product_ids JSONB;
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS and Policy
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on discounts') THEN
    CREATE POLICY "Allow public access on discounts" ON public.discounts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
