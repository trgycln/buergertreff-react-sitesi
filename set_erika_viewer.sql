-- 1. ADIM: PostgreSQL Enum'ına 'viewer' rolünü ekleyin
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'viewer';

-- 2. ADIM: Erika Hanım'a doğrudan sizin belirleyeceğiniz bir şifre atayın
-- (Aşağıdaki 'Erika2026!' yerine istediğiniz şifreyi yazabilirsiniz)
UPDATE auth.users
SET encrypted_password = crypt('Erika2026!', gen_salt('bf'))
WHERE email ILIKE 'Erika.Uber@t-online.de';

-- 3. ADIM: Erika Hanım'ın rolünü 'viewer' yapın
UPDATE public.profiles
SET role = 'viewer'
WHERE email ILIKE 'Erika.Uber@t-online.de';

-- KONTROL: Rolün güncellendiğini doğrulayın
SELECT id, email, role FROM public.profiles WHERE email ILIKE 'Erika.Uber@t-online.de';
