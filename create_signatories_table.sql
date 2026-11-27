-- ============================================
-- UNTERSCHRIFTSBERECHTIGTE (Amtsinhaber-Historie)
-- ============================================
-- Jede Zeile = "ab Datum X ist Person Y im Amt, mit Unterschrift Z".
-- Dokumente (Rechnung, Spendenbescheinigung) wählen anhand IHRES Datums
-- die zu diesem Zeitpunkt gültige Zeile. Dadurch ändern sich alte
-- Dokumente nicht, wenn ein neuer Amtsinhaber eingetragen wird.
--
-- Rollen:
--   'vorsitzende' -> Name + Unterschrift auf Rechnungen
--   'kassierer'   -> Name + Unterschrift auf Spendenbescheinigungen
--
-- In Supabase SQL-Editor ausführen.

CREATE TABLE IF NOT EXISTS public.accounting_signatories (
  id BIGSERIAL PRIMARY KEY,
  role VARCHAR(30) NOT NULL CHECK (role IN ('vorsitzende', 'kassierer')),
  name VARCHAR(255) NOT NULL,
  -- Entweder ein öffentlicher Pfad (z.B. '/imza.png') oder ein Pfad im privaten Bucket 'receipts'
  signature_path TEXT,
  valid_from DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (role, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_signatories_role_date ON public.accounting_signatories(role, valid_from);

ALTER TABLE public.accounting_signatories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signatories read" ON public.accounting_signatories;
CREATE POLICY "signatories read" ON public.accounting_signatories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "signatories insert" ON public.accounting_signatories;
CREATE POLICY "signatories insert" ON public.accounting_signatories
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "signatories update" ON public.accounting_signatories;
CREATE POLICY "signatories update" ON public.accounting_signatories
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "signatories delete" ON public.accounting_signatories;
CREATE POLICY "signatories delete" ON public.accounting_signatories
  FOR DELETE TO authenticated USING (true);

-- --------------------------------------------
-- Startwerte: gelten rückwirkend für ALLE bisherigen Dokumente (ab 1900-01-01)
-- --------------------------------------------

-- 1. Vorsitzende: bisheriger Name + bisherige fest eingebaute Unterschrift (/imza.png)
INSERT INTO public.accounting_signatories (role, name, signature_path, valid_from)
SELECT 'vorsitzende',
       COALESCE(NULLIF((SELECT value FROM public.site_settings WHERE key = 'vorsitzende_name'), ''), 'Erika Uber'),
       '/imza.png',
       DATE '1900-01-01'
WHERE NOT EXISTS (SELECT 1 FROM public.accounting_signatories WHERE role = 'vorsitzende');

-- Kassierer/in: bisheriger Name, noch ohne Unterschrift.
-- Die Unterschrift wird danach in Einstellungen hochgeladen und gilt dann
-- auch für alle bisherigen Spendenbescheinigungen.
INSERT INTO public.accounting_signatories (role, name, signature_path, valid_from)
SELECT 'kassierer',
       COALESCE(NULLIF((SELECT value FROM public.site_settings WHERE key = 'treasurer_name'), ''), 'Kassierer/in'),
       NULL,
       DATE '1900-01-01'
WHERE NOT EXISTS (SELECT 1 FROM public.accounting_signatories WHERE role = 'kassierer');
