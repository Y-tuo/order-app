-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_reply TEXT,
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);

-- 3. Set RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read customers" ON public.customers
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert customers" ON public.customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update customers" ON public.customers
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete customers" ON public.customers
    FOR DELETE USING (true);
