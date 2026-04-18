-- ============================================================
-- MIGRIMI 003: Lidhja User → Pajisje + RLS e saktë
-- Ekzekuto në Supabase SQL Editor
-- ============================================================

-- ── 1. Fshi policies të vjetra ────────────────────────────
drop policy if exists "devices_admin_all"        on public.devices;
drop policy if exists "devices_all"              on public.devices;
drop policy if exists "positions_all"            on public.positions;
drop policy if exists "events_all"               on public.events;
drop policy if exists "trips_all"                on public.trips;
drop policy if exists "geofences_all"            on public.geofences;
drop policy if exists "geofence_devices_all"     on public.geofence_devices;

-- ── 2. Helper function: a është admin? ───────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── 3. DEVICES policies ───────────────────────────────────
-- Admin: gjithçka
create policy "admin_devices_all"
  on public.devices for all
  using (public.is_admin());

-- Driver: sheh vetëm pajisjet e tij
create policy "driver_devices_select"
  on public.devices for select
  using (owner_id = auth.uid());

-- ── 4. POSITIONS policies ─────────────────────────────────
-- Admin: gjithçka
create policy "admin_positions_all"
  on public.positions for all
  using (public.is_admin());

-- Driver: sheh pozicionet e pajisjeye të tij
create policy "driver_positions_select"
  on public.positions for select
  using (
    exists (
      select 1 from public.devices
      where id = device_id and owner_id = auth.uid()
    )
  );

-- GPS client (anon): mund të insertojë
create policy "anon_positions_insert"
  on public.positions for insert
  with check (true);

-- ── 5. EVENTS policies ────────────────────────────────────
create policy "admin_events_all"
  on public.events for all
  using (public.is_admin());

create policy "driver_events_select"
  on public.events for select
  using (
    exists (
      select 1 from public.devices
      where id = device_id and owner_id = auth.uid()
    )
  );

create policy "anon_events_insert"
  on public.events for insert
  with check (true);

-- ── 6. TRIPS policies ─────────────────────────────────────
create policy "admin_trips_all"
  on public.trips for all
  using (public.is_admin());

create policy "driver_trips_select"
  on public.trips for select
  using (
    exists (
      select 1 from public.devices
      where id = device_id and owner_id = auth.uid()
    )
  );

-- ── 7. GEOFENCES: të gjithë mund të shohin ───────────────
create policy "all_geofences_select"
  on public.geofences for select
  using (true);

create policy "admin_geofences_all"
  on public.geofences for all
  using (public.is_admin());

-- ── 8. GEOFENCE_DEVICES ───────────────────────────────────
create policy "admin_geofence_devices_all"
  on public.geofence_devices for all
  using (public.is_admin());

-- ── 9. Shto kolonën category në devices ──────────────────
-- për të dalluar: vehicle / person / animal / asset
alter table public.devices
  add column if not exists category text default 'vehicle'
    check (category in ('vehicle','person','animal','asset'));

-- ── 10. Verifiko
select
  schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('devices','positions','events','trips')
order by tablename, policyname;
