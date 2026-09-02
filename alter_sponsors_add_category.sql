-- 1. Sponsors tablosuna 'category' kolonu ekle (eğer yoksa)
ALTER TABLE public.sponsors 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'institution';

-- 2. Mevcut verilerin kategorilerini düzenle
UPDATE public.sponsors SET category = 'institution' WHERE category IS NULL OR category = '';

-- 3. 100€ ve üzeri 17 bağışçıyı ekleme/güncelleme (Başlangıç Seed Verisi)

-- Kurumsal Destekçiler ve Partnerler
INSERT INTO public.sponsors (name, category, website_url, sort_order, is_active)
VALUES
    ('Rotary-Hilfwerk RC Westerwald e.V.', 'institution', 'https://westerwald.rotary.de/', 1, true),
    ('Sparkasse Westerwald-Sieg', 'institution', 'https://www.sk-westerwald-sieg.de/', 2, true),
    ('Deutsche Stiftung für Engagement und Ehrenamt (DSEE)', 'institution', 'https://www.deutsche-stiftung-engagement-und-ehrenamt.de/', 3, true),
    ('Westerwald Bank eG', 'institution', 'https://www.westerwaldbank.de/', 4, true),
    ('Kölschbach Haustechnik GmbH', 'institution', 'https://www.koelschbach.de/', 5, true),
    ('Verbandsgemeinde Wissen', 'institution', 'https://www.rathaus-wissen.de/', 6, true)
ON CONFLICT DO NOTHING;

-- Bireysel Bağışçılar & Gönül Dostlarımız (Özel Şahıslar)
INSERT INTO public.sponsors (name, category, sort_order, is_active)
VALUES
    ('Peter Schmallenbach', 'person', 10, true),
    ('Armin Uber', 'person', 11, true),
    ('Elke Lapp', 'person', 12, true),
    ('Helga Nellen', 'person', 13, true),
    ('Rose Falkenroth', 'person', 14, true),
    ('Carmen Hellinghausen', 'person', 15, true),
    ('Dirk und Gisela Lotz', 'person', 16, true),
    ('Elke Bleeser', 'person', 17, true),
    ('Thomas Schäfer', 'person', 18, true),
    ('Ulla Heling', 'person', 19, true),
    ('Mariya Willmeroth', 'person', 20, true)
ON CONFLICT DO NOTHING;
