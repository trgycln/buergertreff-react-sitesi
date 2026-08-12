-- Einstellungen (site_settings) tablosunu gerçek dernek bilgileriyle doldur
-- Bu scripti Supabase SQL Editörüne yapıştırıp çalıştır

INSERT INTO public.site_settings (key, value)
VALUES
  ('org_name',           'Bürgertreff Wissen e.V.'),
  ('org_address',        'Marktstr. 8'),
  ('org_postal_code',    '57537'),
  ('org_city',           'Wissen/Sieg'),
  ('org_phone',          '0163 6999513'),
  ('org_email',          'buergertreff.wissen@gmail.com'),
  ('org_website',        'https://www.buergertreff-wissen.de'),
  ('org_tax_id',         '02/666/34529'),
  ('exemption_office',   'Altenkirchen-Hachenburg'),
  ('exemption_date',     '2025-07-14'),
  ('bank_name',          'Sparkasse Westerwald-Sieg'),
  ('bank_iban',          'DE27 5735 1030 0055 0844 38'),
  ('bank_bic',           'MALADE51AKI'),
  ('vorsitzende_name',   'Erika Uber'),
  ('treasurer_name',     'Turgay Celen'),
  ('vereinsregister',    ''),
  ('org_facebook',       'https://www.facebook.com/profile.php?id=61585385846803'),
  ('org_instagram',      'https://www.instagram.com/buergertreff.wissen/'),
  ('org_twitter',        ''),
  ('org_purpose',        'Förderung der Jugend- und Altenhilfe, Förderung internationaler Gesinnung, der Toleranz auf allen Gebieten der Kultur und des Völkerverständigungsgedankens, Förderung des bürgerschaftlichen Engagements zugunsten gemeinnütziger, mildtätiger und kirchlicher Zwecke.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
