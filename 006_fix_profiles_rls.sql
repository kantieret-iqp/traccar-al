-- ============================================================
-- FIX: Admin të lexojë të gjitha profiles (për dropdown)
-- Ekzekuto në Supabase SQL Editor
-- ============================================================

-- Shiko policies ekzistuese
select policyname, cmd, qual 
from pg_policies 
where tablename = 'profiles';

-- Fshi policies e vjetra
drop policy if exists "profiles_own"       on public.profiles;
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- Çdo user sheh profilin e vet
create policy "own_profile_select"
  on public.profiles for select
  using (auth.uid() = id);

-- Admin sheh TË GJITHË profiles (për dropdown në DevicesPage)
create policy "admin_all_profiles_select"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Çdo user përditëson profilin e vet
create policy "own_profile_update"
  on public.profiles for update
  using (auth.uid() = id);

-- Admin mund të përditësojë çdo profil
create policy "admin_all_profiles_update"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Verifiko — tani admin duhet të shohë A.Kuka-n
select id, full_name, role, created_at
from public.profiles
order by created_at;
