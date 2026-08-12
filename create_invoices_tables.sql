-- Create accounting_invoices table
CREATE TABLE IF NOT EXISTS public.accounting_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    contact_id BIGINT REFERENCES public.accounting_contacts(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Entwurf', -- Entwurf (Draft), Gesendet (Sent), Bezahlt (Paid), Storniert (Cancelled)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create accounting_invoice_items table
CREATE TABLE IF NOT EXISTS public.accounting_invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES public.accounting_invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security for invoices
ALTER TABLE public.accounting_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies for accounting_invoices
DROP POLICY IF EXISTS "Enable read access for all authenticated users on invoices" ON public.accounting_invoices;
CREATE POLICY "Enable read access for all authenticated users on invoices" ON public.accounting_invoices
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users on invoices" ON public.accounting_invoices;
CREATE POLICY "Enable insert for authenticated users on invoices" ON public.accounting_invoices
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users on invoices" ON public.accounting_invoices;
CREATE POLICY "Enable update for authenticated users on invoices" ON public.accounting_invoices
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users on invoices" ON public.accounting_invoices;
CREATE POLICY "Enable delete for authenticated users on invoices" ON public.accounting_invoices
    FOR DELETE TO authenticated USING (true);

-- Policies for accounting_invoice_items
DROP POLICY IF EXISTS "Enable read access for all authenticated users on invoice items" ON public.accounting_invoice_items;
CREATE POLICY "Enable read access for all authenticated users on invoice items" ON public.accounting_invoice_items
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users on invoice items" ON public.accounting_invoice_items;
CREATE POLICY "Enable insert for authenticated users on invoice items" ON public.accounting_invoice_items
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users on invoice items" ON public.accounting_invoice_items;
CREATE POLICY "Enable update for authenticated users on invoice items" ON public.accounting_invoice_items
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users on invoice items" ON public.accounting_invoice_items;
CREATE POLICY "Enable delete for authenticated users on invoice items" ON public.accounting_invoice_items
    FOR DELETE TO authenticated USING (true);
