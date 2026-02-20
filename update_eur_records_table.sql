-- ============================================
-- EÜR KAYITLARI - GÜNCELLENMIŞ TABLO YAPISI
-- ============================================
-- Dört Vergi Alanı (Sphären) ile detaylı EÜR kaydı

DROP TABLE IF EXISTS accounting_eur_records CASCADE;

CREATE TABLE accounting_eur_records (
  id BIGSERIAL PRIMARY KEY,
  
  -- Temel Bilgiler
  fiscal_year INT NOT NULL,
  period VARCHAR(10), -- "01", "02", ... "12" veya "full_year"
  entry_date DATE NOT NULL, -- İşlemin fiili tarihi (Zu- und Abflussprinzip)
  buchungsnummer VARCHAR(30) NOT NULL UNIQUE, -- Kayıt Numarası (örn: "EÜR-2026-00001")
  
  -- İşlem Açıklaması
  vorgang TEXT, -- "X Kişisinin Aidatı", "Kırtasiye Alımı" vs.
  belegnummer VARCHAR(50), -- Dayanak belge numarası (Fatura, Dekont vs.)
  
  -- Tutar Bilgileri
  amount_gross DECIMAL(15,2) NOT NULL, -- Brüt tutar
  amount_net DECIMAL(15,2), -- Net tutar (KDV hariç)
  amount_vat DECIMAL(15,2) DEFAULT 0, -- KDV tutarı
  vat_rate DECIMAL(5,2) DEFAULT 0, -- KDV oranı (0, 7, 19 gibi)
  
  -- Dört Vergi Alanı (Sphären) Ayrımı
  sphaere VARCHAR(50) NOT NULL, -- 'ideeller' | 'vermögensv' | 'zweckbetrieb' | 'wirtschaftlich'
  
  -- Detaylı Kategorilendirme
  transaction_type VARCHAR(50), -- 'income' | 'expense'
  sub_category VARCHAR(100), -- Gelir: 'beiträge', 'spenden', 'zuschüsse'
                              -- Gider: 'gehalt', 'miete', 'versicherung' vs.
  
  -- Dayanak Belge Yönetimi
  document_url TEXT, -- Belge taraması/dosyası
  stored_location VARCHAR(255), -- Fiziksel depolama yeri (Ordner 1/2026 gibi)
  
  -- Doğrulama ve İmza
  verified_by TEXT, -- Verifiye edenin adı
  verification_date DATE, -- Verifikasyon tarihi
  
  -- İstatistik ve Notlar
  notes TEXT,
  
  -- İç Kontrol (Audit yapabilmek için)
  is_locked BOOLEAN DEFAULT FALSE, -- Dönem sonu kilitlemesi için
  locked_date DATE,
  locked_by TEXT,
  
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_eur_fiscal_year ON accounting_eur_records(fiscal_year);
CREATE INDEX idx_eur_entry_date ON accounting_eur_records(entry_date);
CREATE INDEX idx_eur_sphaere ON accounting_eur_records(sphaere);
CREATE INDEX idx_eur_transaction_type ON accounting_eur_records(transaction_type);
CREATE INDEX idx_eur_buchungsnummer ON accounting_eur_records(buchungsnummer);
CREATE INDEX idx_eur_belegnummer ON accounting_eur_records(belegnummer);

-- ============================================
-- EÜR ÖZETİ VİYEWİ (Raporlama için)
-- ============================================

CREATE OR REPLACE VIEW accounting_eur_summary AS
SELECT 
  fiscal_year,
  sphaere,
  transaction_type,
  SUM(amount_gross) as total_amount,
  COUNT(*) as entry_count,
  SUM(amount_vat) as total_vat
FROM accounting_eur_records
GROUP BY fiscal_year, sphaere, transaction_type;

-- ============================================
-- BÖLÜM ÖZETİ (Her Sphäre için özet)
-- ============================================

CREATE OR REPLACE VIEW accounting_eur_sphaere_summary AS
SELECT 
  fiscal_year,
  sphaere,
  COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount_gross ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount_gross ELSE 0 END), 0) as total_expense,
  COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount_gross ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount_gross ELSE 0 END), 0) as net_result
FROM accounting_eur_records
WHERE is_locked = FALSE OR locked_date >= (CURRENT_DATE - INTERVAL '1 year')
GROUP BY fiscal_year, sphaere
ORDER BY fiscal_year DESC, sphaere;
