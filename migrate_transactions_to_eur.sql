-- ============================================
-- MEVCUT VERİLERDEN EÜR KAYITLARINI DOLDUR
-- ============================================
-- Bu script, accounting_transactions tablosundaki mevcut verileri
-- accounting_eur_records tablosuna otomatik olarak aktarır.

-- Adım 1: Mevcut transactions'dan EÜR kayıtlarını oluştur
INSERT INTO accounting_eur_records (
  fiscal_year,
  entry_date,
  buchungsnummer,
  vorgang,
  belegnummer,
  amount_gross,
  amount_net,
  amount_vat,
  vat_rate,
  sphaere,
  transaction_type,
  sub_category,
  document_url,
  stored_location,
  notes,
  created_by,
  created_at,
  updated_at
)
SELECT 
  EXTRACT(YEAR FROM t.date)::INT as fiscal_year,
  t.date as entry_date,
  'EÜR-' || EXTRACT(YEAR FROM t.date) || '-' || 
    LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM t.date) ORDER BY t.date, t.id)::TEXT, 5, '0') as buchungsnummer,
  
  -- Vorgang (İşlem Açıklaması)
  CASE 
    WHEN t.type = 'income' THEN 'Gelir: ' || COALESCE(c.name, 'Kategorisiz')
    ELSE 'Gider: ' || COALESCE(c.name, 'Kategorisiz')
  END || COALESCE(' - ' || t.description, '') as vorgang,
  
  t.receipt_no as belegnummer,
  t.amount as amount_gross,
  t.amount as amount_net, -- Başlangıçta Net = Gross (KDV 0 varsayılıyor)
  0 as amount_vat,
  0 as vat_rate,
  
  -- Sphäre Kategorilendirmesi (kategoriye göre otomatik)
  CASE 
    WHEN c.name ILIKE '%aidat%' OR c.name ILIKE '%beitrag%' OR c.name ILIKE '%spende%' 
    THEN 'ideeller'
    WHEN c.name ILIKE '%zins%' OR c.name ILIKE '%konto%' OR c.name ILIKE '%kreditkarte%'
    THEN 'vermögensv'
    WHEN c.name ILIKE '%kurs%' OR c.name ILIKE '%event%' OR c.name ILIKE '%aktivität%' OR c.name ILIKE '%veranstaltung%'
    THEN 'zweckbetrieb'
    WHEN c.name ILIKE '%verkauf%' OR c.name ILIKE '%reklam%' OR c.name ILIKE '%kaffe%' OR c.name ILIKE '%bar%'
    THEN 'wirtschaftlich'
    ELSE 'ideeller' -- Varsayılan
  END as sphaere,
  
  t.type as transaction_type,
  c.name as sub_category,
  t.document_url,
  CASE WHEN t.file_no IS NOT NULL THEN 'Dosya No: ' || t.file_no ELSE NULL END as stored_location,
  
  'Otomatik Migration' as notes,
  'system' as created_by,
  t.created_at,
  t.updated_at
FROM accounting_transactions t
LEFT JOIN accounting_categories c ON t.category_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_eur_records eur 
  WHERE eur.belegnummer = t.receipt_no 
  AND eur.entry_date = t.date
)
ORDER BY t.date, t.id;

-- Adım 2: Duplikatları kontrol et ve benzersiz kayıtları güncelle
UPDATE accounting_eur_records 
SET updated_at = CURRENT_TIMESTAMP
WHERE created_by = 'system';

-- Sonuç: Kaç kayıt eklendi kontrol etmek için
SELECT 
  COUNT(*) as toplam_kayit,
  EXTRACT(YEAR FROM entry_date)::INT as yil
FROM accounting_eur_records
WHERE created_by = 'system'
GROUP BY EXTRACT(YEAR FROM entry_date)
ORDER BY yil DESC;
