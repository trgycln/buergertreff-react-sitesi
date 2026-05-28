-- ============================================
-- KASSENZÄHLPROTOKOLL / EIGENBELEG
-- ============================================

CREATE TABLE IF NOT EXISTS accounting_cash_count_protocols (
  id BIGSERIAL PRIMARY KEY,
  document_number VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  location VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  total DECIMAL(15,2),
  business_income DECIMAL(15,2),
  donations DECIMAL(15,2),
  note TEXT,
  second_signer VARCHAR(255),
  second_signer_role VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cash_count_date ON accounting_cash_count_protocols(date);
CREATE INDEX IF NOT EXISTS idx_cash_count_doc_number ON accounting_cash_count_protocols(document_number);
