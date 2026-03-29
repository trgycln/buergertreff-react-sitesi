-- Kalender Terminserien: Wiederholungseinheit + Intervall
ALTER TABLE calendar_recurring_entries
  ADD COLUMN IF NOT EXISTS recurrence_unit VARCHAR(10);

ALTER TABLE calendar_recurring_entries
  ADD COLUMN IF NOT EXISTS recurrence_interval SMALLINT;

UPDATE calendar_recurring_entries
SET recurrence_unit = COALESCE(recurrence_unit, 'week');

UPDATE calendar_recurring_entries
SET recurrence_interval = COALESCE(recurrence_interval, 1);

ALTER TABLE calendar_recurring_entries
  ALTER COLUMN recurrence_unit SET DEFAULT 'week';

ALTER TABLE calendar_recurring_entries
  ALTER COLUMN recurrence_unit SET NOT NULL;

ALTER TABLE calendar_recurring_entries
  ALTER COLUMN recurrence_interval SET DEFAULT 1;

ALTER TABLE calendar_recurring_entries
  ALTER COLUMN recurrence_interval SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_calendar_recurring_recurrence_unit'
  ) THEN
    ALTER TABLE calendar_recurring_entries
      ADD CONSTRAINT chk_calendar_recurring_recurrence_unit
      CHECK (recurrence_unit IN ('week', 'month'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_calendar_recurring_recurrence_interval'
  ) THEN
    ALTER TABLE calendar_recurring_entries
      ADD CONSTRAINT chk_calendar_recurring_recurrence_interval
      CHECK (recurrence_interval >= 1);
  END IF;
END $$;
