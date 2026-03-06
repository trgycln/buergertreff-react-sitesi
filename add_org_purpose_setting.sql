-- Add all organization information to site_settings table
-- Run this SQL in your Supabase SQL editor

-- Add basic organization information
INSERT INTO site_settings (key, value) VALUES ('org_name', 'Bürgertreff Wissen e.V.') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('org_address', 'Straße Beispiel 42') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('org_postal_code', '57612') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('org_city', 'Altenkirchen') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add contact information
INSERT INTO site_settings (key, value) VALUES ('org_phone', '+49 2681 123456') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('org_email', 'info@example.de') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('org_website', 'https://www.example.de') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add social media information
INSERT INTO site_settings (key, value) VALUES ('org_facebook', 'https://facebook.com/example') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('org_instagram', 'https://instagram.com/example') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('org_twitter', 'https://twitter.com/example') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add tax and accounting information
INSERT INTO site_settings (key, value) VALUES ('org_tax_id', '02/650/2316/4') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('exemption_date', '2023-12-15') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('exemption_office', 'Finanzamt Altenkirchen-Hachenburg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add responsible person
INSERT INTO site_settings (key, value) VALUES ('treasurer_name', 'Turgay Celen') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add organization purpose
INSERT INTO site_settings (key, value) 
VALUES (
  'org_purpose', 
  'Förderung der Jugend- und Altenhilfe, Förderung internationaler Gesinnung, der Toleranz auf allen Gebieten der Kultur und des Völkerverständigungsgedankens, Förderung des bürgerschaftlichen Engagements zugunsten gemeinnütziger, mildtätiger und kirchlicher Zwecke.'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
