-- Erika.Uber@t-online.de kullanıcısını 'viewer' (Sadece Okuma) rolüne ayarlama scripti

-- 1. Profiles tablosunda Erika Hanım'ın rolünü 'viewer' olarak güncelleyin
UPDATE public.profiles
SET role = 'viewer'
WHERE email ILIKE 'Erika.Uber@t-online.de';

-- 2. Eğer henüz profiles tablosunda kaydı oluşmadıysa (auth.users tablosundan alarak ekleme):
INSERT INTO public.profiles (id, email, role, full_name)
SELECT id, email, 'viewer', 'Erika Uber'
FROM auth.users
WHERE email ILIKE 'Erika.Uber@t-online.de'
ON CONFLICT (id) DO UPDATE
SET role = 'viewer';

-- Kontrol sorgusu (Rolün 'viewer' olduğunu doğrulamak için):
SELECT id, email, role, full_name FROM public.profiles WHERE email ILIKE 'Erika.Uber@t-online.de';
