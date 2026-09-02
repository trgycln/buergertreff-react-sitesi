-- accounting_contacts tablosuna category, logo_url ve website_url alanlarını ekle
ALTER TABLE public.accounting_contacts 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'person',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Bilinen kurumları 'institution' olarak güncelle
UPDATE public.accounting_contacts 
SET category = 'institution' 
WHERE name ILIKE '%Rotary%' 
   OR name ILIKE '%Sparkasse%' 
   OR name ILIKE '%Stiftung%' 
   OR name ILIKE '%Westerwald Bank%' 
   OR name ILIKE '%Kölschbach%' 
   OR name ILIKE '%Verbandsgemeinde%';
