-- Sponsorlar tablosu
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Herkese açık okuma (sadece aktif sponsorlar)
CREATE POLICY "Public can view active sponsors"
    ON public.sponsors
    FOR SELECT
    USING (is_active = true);

-- Giriş yapmış adminler tam yönetim
CREATE POLICY "Authenticated can manage sponsors"
    ON public.sponsors
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Mevcut statik sponsorları başlangıç verisi olarak ekle
INSERT INTO public.sponsors (name, website_url, sort_order, is_active) VALUES
    ('Kölschbach Heizung Klima Sanitär', 'https://www.koelschbach.de/', 1, true),
    ('Sparkasse Westerwald-Sieg', 'https://www.sk-westerwald-sieg.de/de/home.html', 2, true),
    ('KS Druck Schneider', 'https://ks-druck-schneider.de/', 3, true);
