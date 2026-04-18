-- ============================================================
-- MIGRIMI 004: Device Watchers — Shumë user monitorojnë
-- Ekzekuto në Supabase SQL Editor
-- ============================================================

-- ── 1. Tabela device_watchers ─────────────────────────────
create table if not exists public.device_watchers (
  device_id        uuid references public.devices(id) on delete cascade,
  user_id          uuid references public.profiles(id) on delete cascade,
  can_see_history  boolean default true,
  added_by         uuid references public.profiles(id),
  added_at         timestamptz default now(),
  primary key (device_id, user_id)
);

alter table public.device_watchers enable row level security;

-- Admin menaxhon gjithçka
create policy "admin_watchers_all"
  on public.device_watchers for all
  using (public.is_admin());

-- User sheh vetëm lidhjet e tij
create policy "user_own_watchers_select"
  on public.device_watchers for select
  using (user_id = auth.uid());

-- ── 2. Rifresko RLS te DEVICES ────────────────────────────
drop policy if exists "driver_devices_select"     on public.devices;
drop policy if exists "driver_or_watcher_devices" on public.devices;

create policy "driver_or_watcher_devices"
  on public.devices for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.device_watchers
      where device_id = id and user_id = auth.uid()
    )
  );

-- ── 3. Rifresko RLS te POSITIONS ──────────────────────────
drop policy if exists "driver_positions_select"         on public.positions;
drop policy if exists "driver_or_watcher_positions"     on public.positions;

create policy "driver_or_watcher_positions"
  on public.positions for select
  using (
    exists (
      select 1 from public.devices
      where id = device_id and owner_id = auth.uid()
    )
    or exists (
      select 1 from public.device_watchers
      where device_id = positions.device_id and user_id = auth.uid()
    )
  );

-- ── 4. Rifresko RLS te EVENTS ─────────────────────────────
drop policy if exists "driver_events_select"         on public.events;
drop policy if exists "driver_or_watcher_events"     on public.events;

create policy "driver_or_watcher_events"
  on public.events for select
  using (
    exists (
      select 1 from public.devices
      where id = device_id and owner_id = auth.uid()
    )
    or exists (
      select 1 from public.device_watchers
      where device_id = events.device_id and user_id = auth.uid()
    )
  );

-- ── 5. Rifresko RLS te TRIPS ──────────────────────────────
drop policy if exists "driver_trips_select"         on public.trips;
drop policy if exists "driver_or_watcher_trips"     on public.trips;

create policy "driver_or_watcher_trips"
  on public.trips for select
  using (
    exists (
      select 1 from public.devices
      where id = device_id and owner_id = auth.uid()
    )
    or exists (
      select 1 from public.device_watchers
      where device_id = trips.device_id and user_id = auth.uid()
    )
  );

-- ── 6. View: pajisjet me numrin e watchers ────────────────
create or replace view public.devices_with_watchers as
select
  d.*,
  count(dw.user_id) as watcher_count,
  array_agg(dw.user_id) filter (where dw.user_id is not null) as watcher_ids
from public.devices d
left join public.device_watchers dw on dw.device_id = d.id
group by d.id;

-- ── 7. Function: shto watcher me kontroll ────────────────
create or replace function public.add_device_watcher(
  p_device_id uuid,
  p_user_id   uuid,
  p_history   boolean default true
)
returns json language plpgsql security definer as $$
begin
  if not public.is_admin() then
    return json_build_object('error', 'Vetëm adminët mund të shtojnë watchers');
  end if;

  insert into public.device_watchers (device_id, user_id, can_see_history, added_by)
  values (p_device_id, p_user_id, p_history, auth.uid())
  on conflict (device_id, user_id) do update
    set can_see_history = p_history;

  return json_build_object('success', true);
end;
$$;

create or replace function public.remove_device_watcher(
  p_device_id uuid,
  p_user_id   uuid
)
returns json language plpgsql security definer as $$
begin
  if not public.is_admin() then
    return json_build_object('error', 'Vetëm adminët mund të heqin watchers');
  end if;

  delete from public.device_watchers
  where device_id = p_device_id and user_id = p_user_id;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.add_device_watcher    to authenticated;
grant execute on function public.remove_device_watcher to authenticated;

-- ── 8. Verifiko ───────────────────────────────────────────
select 'device_watchers u krijua!' as status,
       count(*) as watchers_count
from public.device_watchers;
