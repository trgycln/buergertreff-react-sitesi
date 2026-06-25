-- Veritabanına Alt Kategori özelliklerini eklemek için gerekli sorgular

-- 1. accounting_categories tablosuna subcategories sütunu ekleme (virgülle ayrılmış liste)
ALTER TABLE accounting_categories ADD COLUMN IF NOT EXISTS subcategories TEXT;

-- 2. accounting_transactions tablosuna subcategory sütunu ekleme
ALTER TABLE accounting_transactions ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);
