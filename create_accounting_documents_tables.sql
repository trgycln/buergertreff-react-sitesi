-- ============================================
-- MUHASEBE BELGELERİ / BUCHHALTUNGSDOKUMENTE
-- ============================================
-- Bu tablolar e.V. muhasebesi için resmi belgeleri takip etmek üzere oluşturulmuştur.

-- 1. Einnahmen-Überschuss-Rechnung (EÜR) - Gelir-Gider Hesaplaması Kayıtları
CREATE TABLE IF NOT EXISTS accounting_eur_records (
  id BIGSERIAL PRIMARY KEY,
  fiscal_year INT NOT NULL,
  period VARCHAR(10), -- "01", "02", etc. atau "full_year"
  total_income DECIMAL(15,2) DEFAULT 0,
  total_expenses DECIMAL(15,2) DEFAULT 0,
  net_income DECIMAL(15,2) DEFAULT 0,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Kassenbuch - Kasa Defteri (Günlük Nakit Hareketleri)
CREATE TABLE IF NOT EXISTS accounting_cash_journal (
  id BIGSERIAL PRIMARY KEY,
  entry_date DATE NOT NULL,
  entry_number VARCHAR(20), -- "001/2026", "002/2026", etc.
  opening_balance DECIMAL(15,2) DEFAULT 0,
  cash_in DECIMAL(15,2) DEFAULT 0,
  cash_out DECIMAL(15,2) DEFAULT 0,
  closing_balance DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  verified_by TEXT,
  verification_date DATE,
  document_url TEXT, -- Belge/sunak taraması
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Buchungsbelege - Muhasebe Fişleri ve Dayanak Belgeler
CREATE TABLE IF NOT EXISTS accounting_vouchers (
  id BIGSERIAL PRIMARY KEY,
  voucher_date DATE NOT NULL,
  voucher_number VARCHAR(20) NOT NULL UNIQUE, -- "2026/00001"
  voucher_type VARCHAR(50), -- "invoice", "receipt", "bank_statement", "credit_note"
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT,
  document_url TEXT,
  stored_location VARCHAR(255), -- "Ordner 1/Kassenbuch" vb.
  supplier_contact_id BIGINT REFERENCES accounting_contacts(id),
  category_id BIGINT REFERENCES accounting_categories(id),
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Zuwendungsbestätigungen (Bağış Teyit Belgeleri)
CREATE TABLE IF NOT EXISTS accounting_donation_confirmations (
  id BIGSERIAL PRIMARY KEY,
  confirmation_number VARCHAR(20) NOT NULL UNIQUE, -- "SPENDE-2026/00001"
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255),
  donor_phone VARCHAR(20),
  donor_address TEXT,
  donation_date DATE NOT NULL,
  donation_amount DECIMAL(15,2) NOT NULL,
  donation_type VARCHAR(50), -- "cash", "transfer", "goods"
  purpose TEXT,
  confirmation_issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tax_deductible BOOLEAN DEFAULT TRUE,
  confirmation_document_url TEXT,
  notes TEXT,
  issued_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Spendenverwaltungsblatt - Bağış Yönetim Çizelgesi
CREATE TABLE IF NOT EXISTS accounting_donation_registry (
  id BIGSERIAL PRIMARY KEY,
  fiscal_year INT NOT NULL,
  total_donations DECIMAL(15,2) DEFAULT 0,
  total_donors_counted INT DEFAULT 0,
  cash_donations DECIMAL(15,2) DEFAULT 0,
  transfer_donations DECIMAL(15,2) DEFAULT 0,
  goods_donations_value DECIMAL(15,2) DEFAULT 0,
  largest_donation DECIMAL(15,2),
  average_donation DECIMAL(15,2),
  special_notes TEXT,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  compiled_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Belege für Sachspenden - Ayni Bağış Değerleme Belgeleri
CREATE TABLE IF NOT EXISTS accounting_noncash_donations (
  id BIGSERIAL PRIMARY KEY,
  donation_number VARCHAR(20) NOT NULL UNIQUE, -- "SACHSPENDE-2026/00001"
  donation_date DATE NOT NULL,
  item_description TEXT NOT NULL,
  item_category VARCHAR(100), -- "Möbel", "Elektronik", "Kleidung", etc.
  quantity INT DEFAULT 1,
  unit_of_measure VARCHAR(20), -- "Stück", "kg", "Satz", etc.
  estimated_value DECIMAL(15,2) NOT NULL,
  valuation_basis TEXT, -- "Marktpreis", "Fachmeinung", "Katalogpreis"
  valuation_expert TEXT, -- Wer die Bewertung gemacht hat
  donor_name VARCHAR(255),
  donor_contact_id BIGINT REFERENCES accounting_contacts(id),
  photos_url TEXT, -- URL zu Fotos/Dokumentation
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Üye ve Aidat Takip Listesi - Mitglieder- und Beitragsverwaltung
CREATE TABLE IF NOT EXISTS accounting_member_tracking (
  id BIGSERIAL PRIMARY KEY,
  fiscal_year INT NOT NULL,
  member_id BIGINT REFERENCES accounting_contacts(id),
  member_name VARCHAR(255),
  membership_start_date DATE,
  membership_end_date DATE,
  membership_status VARCHAR(50), -- "active", "inactive", "suspended"
  annual_fee DECIMAL(15,2) DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  payment_date DATE,
  payment_method VARCHAR(50), -- "bank_transfer", "cash"
  outstanding_amount DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fiscal_year, member_id)
);

-- 8. Freistellungsbescheid - Vergi Muafiyet Belgeleri
CREATE TABLE IF NOT EXISTS accounting_tax_exemptions (
  id BIGSERIAL PRIMARY KEY,
  exemption_number VARCHAR(20) NOT NULL UNIQUE, -- "FA-2026-00001"
  issue_date DATE NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE,
  issued_by_tax_office TEXT, -- Tax office name/location
  organization_name TEXT,
  registration_number TEXT,
  exemption_type VARCHAR(100), -- "Körperschaftsteuer", "Gewerbesteuer", "Umsatzsteuer"
  document_url TEXT, -- Belge taraması
  notes TEXT,
  responsible_person TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Rücklagen - Yedek Akçe ve Rezerv Kayıtları
CREATE TABLE IF NOT EXISTS accounting_reserves (
  id BIGSERIAL PRIMARY KEY,
  fiscal_year INT NOT NULL,
  reserve_name VARCHAR(255) NOT NULL, -- "Notfallfonds", "Betriebsmittelreserve", etc.
  opening_balance DECIMAL(15,2) DEFAULT 0,
  additions DECIMAL(15,2) DEFAULT 0,
  withdrawals DECIMAL(15,2) DEFAULT 0,
  closing_balance DECIMAL(15,2) DEFAULT 0,
  purpose TEXT,
  approval_date DATE,
  approved_by TEXT, -- Yönetim kurulu üyesi
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fiscal_year, reserve_name)
);

-- 10. Lohnkonten - Ücret Kayıtları (Çalışan/Eğitmen Ödemeleri)
CREATE TABLE IF NOT EXISTS accounting_payroll (
  id BIGSERIAL PRIMARY KEY,
  fiscal_year INT NOT NULL,
  month INT, -- 1-12
  employee_name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(20),
  employee_contact_id BIGINT REFERENCES accounting_contacts(id),
  position_title VARCHAR(100),
  gross_salary DECIMAL(15,2) NOT NULL,
  tax_deductions DECIMAL(15,2) DEFAULT 0,
  social_insurance DECIMAL(15,2) DEFAULT 0,
  other_deductions DECIMAL(15,2) DEFAULT 0,
  net_salary DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  document_url TEXT, -- Maaş bordrosu vs.
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Karar Defteri ve Protokoller - Entscheidungsprotokolle
CREATE TABLE IF NOT EXISTS accounting_decisions (
  id BIGSERIAL PRIMARY KEY,
  decision_date DATE NOT NULL,
  meeting_type VARCHAR(50), -- "Vorstandssitzung", "Mitgliederversammlung", etc.
  meeting_number VARCHAR(20),
  decision_number VARCHAR(20) NOT NULL UNIQUE, -- "BESCHL-2026-00001"
  decision_title VARCHAR(255) NOT NULL,
  financial_impact BOOLEAN DEFAULT FALSE,
  amount DECIMAL(15,2), -- Eğer finansal etki varsa
  decision_description TEXT,
  approved_by TEXT,
  attendees TEXT, -- Katılımcılar listesi
  vote_result VARCHAR(100), -- "einstimmig", "5 ja, 1 nein"
  protocol_document_url TEXT,
  implemented_date DATE,
  implementation_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler - Sorguları hızlandırmak için
CREATE INDEX idx_eur_records_fiscal_year ON accounting_eur_records(fiscal_year);
CREATE INDEX idx_cash_journal_entry_date ON accounting_cash_journal(entry_date);
CREATE INDEX idx_vouchers_date ON accounting_vouchers(voucher_date);
CREATE INDEX idx_vouchers_number ON accounting_vouchers(voucher_number);
CREATE INDEX idx_donations_date ON accounting_donation_confirmations(donation_date);
CREATE INDEX idx_donations_donor_name ON accounting_donation_confirmations(donor_name);
CREATE INDEX idx_donation_registry_year ON accounting_donation_registry(fiscal_year);
CREATE INDEX idx_noncash_donation_date ON accounting_noncash_donations(donation_date);
CREATE INDEX idx_member_tracking_year ON accounting_member_tracking(fiscal_year);
CREATE INDEX idx_tax_exemption_date ON accounting_tax_exemptions(issue_date);
CREATE INDEX idx_reserves_fiscal_year ON accounting_reserves(fiscal_year);
CREATE INDEX idx_payroll_fiscal_month ON accounting_payroll(fiscal_year, month);
CREATE INDEX idx_decisions_date ON accounting_decisions(decision_date);

-- RLS (Row Level Security) ayarları - İsteğe bağlı, ama e.V. muhasebesi için önemli
-- Bu tabloları enable-rls-policy ile koruyabilirsiniz, fakat şimdilik temel yapıyı kuruyoruz
