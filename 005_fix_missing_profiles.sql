-- ============================================================
-- FIX: Krijo profile për të gjithë user-at ekzistues
-- Ekzekuto në Supabase SQL Editor
-- ============================================================

-- 1. Shto profile për çdo user në auth.users që nuk ka profile
insert into public.profiles (id, full_name, role)
select
  au.id,
  coalesce(
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)  -- përdor pjesën para @ si emër
  ),
  coalesce(au.raw_user_meta_data->>'role', 'driver')
from auth.users au
where not exists (
  select 1 from public.profiles p where p.id = au.id
)
on conflict (id) do nothing;

-- 2. Shiko rezultatin — duhet të shfaqë të gjithë user-at
select
  p.id,
  p.full_name,
  p.role,
  au.email,
  p.created_at
from public.profiles p
join auth.users au on au.id = p.id
order by p.created_at;

-- 3. Nëse doni të ndryshoni rolin e një user-i manualisht:
-- update public.profiles set role = 'driver' where id = 'USER_ID_KËTU';
-- update public.profiles set full_name = 'Emri Mbiemri' where id = 'USER_ID_KËTU';
