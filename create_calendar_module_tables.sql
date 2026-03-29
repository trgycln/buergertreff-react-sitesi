-- ============================================
-- TERMINKALENDER MODULU / STANDALONE CALENDAR
-- ============================================

-- Wiederkehrende Termine (z.B. jeden Dienstag und Donnerstag)
CREATE TABLE IF NOT EXISTS calendar_recurring_entries (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location TEXT,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  recurrence_unit VARCHAR(10) NOT NULL DEFAULT 'week',
  recurrence_interval SMALLINT NOT NULL DEFAULT 1,
  weekdays SMALLINT[] NOT NULL,
  start_time TIME,
  end_time TIME,
  color VARCHAR(20) DEFAULT 'red',
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_calendar_recurring_date_range CHECK (end_date >= start_date),
  CONSTRAINT chk_calendar_recurring_recurrence_unit CHECK (recurrence_unit IN ('week', 'month')),
  CONSTRAINT chk_calendar_recurring_recurrence_interval CHECK (recurrence_interval >= 1),
  CONSTRAINT chk_calendar_recurring_weekdays CHECK (array_length(weekdays, 1) >= 1)
);

-- Einzeltermine (z.B. ein Ausflug oder Sondertermin an einem konkreten Tag)
CREATE TABLE IF NOT EXISTS calendar_single_entries (
  id BIGSERIAL PRIMARY KEY,
  source_type VARCHAR(30),
  source_event_id BIGINT UNIQUE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location TEXT,
  description TEXT,
  entry_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  color VARCHAR(20) DEFAULT 'red',
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexe
CREATE INDEX IF NOT EXISTS idx_calendar_recurring_date_range
  ON calendar_recurring_entries(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_calendar_recurring_public_active
  ON calendar_recurring_entries(is_public, is_active);

CREATE INDEX IF NOT EXISTS idx_calendar_single_entry_date
  ON calendar_single_entries(entry_date);

CREATE INDEX IF NOT EXISTS idx_calendar_single_public_active
  ON calendar_single_entries(is_public, is_active);

CREATE INDEX IF NOT EXISTS idx_calendar_single_source_event
  ON calendar_single_entries(source_event_id);