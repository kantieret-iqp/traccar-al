-- ============================================================
-- FIX FINAL: Zgjidhja më e thjeshtë dhe pa recursion
-- Ekzekuto këtë në Supabase SQL Editor
-- ============================================================

-- Fshi TË GJITHA policies ekzistuese te profiles
drop policy if exists "own_profile_select"           on public.profiles;
drop policy if exists "admin_all_profiles_select"    on public.profiles;
drop policy if exists "own_profile_update"           on public.profiles;
drop policy if exists "admin_all_profiles_update"    on public.profiles;
drop policy if exists "profiles_own"                 on public.profiles;
drop policy if exists "select_own_profile"           on public.profiles;
drop policy if exists "admin_select_all_profiles"    on public.profiles;
drop policy if exists "update_own_profile"           on public.profiles;
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- ZGJIDHJA FINALE:
-- Çdo user i loguar mund të lexojë të gjitha profiles
-- (Emrat e user-ave nuk janë të dhëna sekrete)
create policy "authenticated_read_profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Vetëm veten mund ta përditësosh
create policy "own_profile_update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Verifiko — duhet të tregojë të dy user-at pa error
select id, full_name, role from public.profiles order by created_at;
