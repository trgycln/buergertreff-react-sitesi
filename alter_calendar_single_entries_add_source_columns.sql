-- Add source linkage for automatic sync from ereignisse to calendar
ALTER TABLE calendar_single_entries
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(30);

ALTER TABLE calendar_single_entries
  ADD COLUMN IF NOT EXISTS source_event_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_calendar_single_source_event_id'
  ) THEN
    ALTER TABLE calendar_single_entries
      ADD CONSTRAINT uq_calendar_single_source_event_id UNIQUE (source_event_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_calendar_single_source_event
  ON calendar_single_entries(source_event_id);
