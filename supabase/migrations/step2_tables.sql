-- ============================================================
-- HAPI 2: Krijo të gjitha tabelat nga e para
-- Ekzekuto të gjithë këtë bllok njëherësh
-- ============================================================

-- Fshi gjithçka ekzistuese (nëse ka)
drop function if exists public.upsert_position cascade;
drop function if exists public.handle_new_user cascade;
drop view if exists public.latest_positions cascade;
drop table if exists public.trips cascade;
drop table if exists public.events cascade;
drop table if exists public.geofence_devices cascade;
drop table if exists public.geofences cascade;
drop table if exists public.positions cascade;
drop table if exists public.devices cascade;
drop table if exists public.profiles cascade;

-- PROFILES
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  role text not null default 'driver' check (role in ('admin', 'driver', 'viewer')),
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_own" on public.profiles for all using (auth.uid() = id);

-- DEVICES
create table public.devices (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  identifier text not null unique,
  plate text,
  icon text default '🚗',
  color text default '#00FF87',
  owner_id uuid references public.profiles(id),
  status text default 'offline' check (status in ('online', 'idle', 'offline')),
  last_seen timestamptz,
  created_at timestamptz default now()
);
alter table public.devices enable row level security;
create policy "devices_admin_all" on public.devices for all using (true);

-- POSITIONS
create table public.positions (
  id bigserial primary key,
  device_id uuid references public.devices(id) on delete cascade not null,
  lat double precision not null,
  lng double precision not null,
  speed double precision default 0,
  course double precision default 0,
  altitude double precision default 0,
  accuracy double precision default 0,
  battery integer,
  satellites integer,
  signal text,
  attributes jsonb default '{}',
  recorded_at timestamptz default now()
);
alter table public.positions enable row level security;
create policy "positions_all" on public.positions for all using (true);
create index idx_positions_device_time on public.positions(device_id, recorded_at desc);

-- GEOFENCES
create table public.geofences (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null default 'circle' check (type in ('circle', 'polygon')),
  center_lat double precision,
  center_lng double precision,
  radius integer default 500,
  polygon_coords jsonb,
  color text default '#4DA6FF',
  active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.geofences enable row level security;
create policy "geofences_all" on public.geofences for all using (true);

-- GEOFENCE_DEVICES
create table public.geofence_devices (
  geofence_id uuid references public.geofences(id) on delete cascade,
  device_id uuid references public.devices(id) on delete cascade,
  primary key (geofence_id, device_id)
);
alter table public.geofence_devices enable row level security;
create policy "geofence_devices_all" on public.geofence_devices for all using (true);

-- EVENTS
create table public.events (
  id bigserial primary key,
  device_id uuid references public.devices(id) on delete cascade,
  geofence_id uuid references public.geofences(id),
  type text not null check (type in ('geofence_enter','geofence_exit','overspeed','online','offline','low_battery')),
  message text,
  lat double precision,
  lng double precision,
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.events enable row level security;
create policy "events_all" on public.events for all using (true);

-- TRIPS
create table public.trips (
  id uuid default gen_random_uuid() primary key,
  device_id uuid references public.devices(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz,
  distance_km double precision default 0,
  avg_speed double precision default 0,
  max_speed double precision default 0,
  start_lat double precision,
  start_lng double precision,
  end_lat double precision,
  end_lng double precision,
  created_at timestamptz default now()
);
alter table public.trips enable row level security;
create policy "trips_all" on public.trips for all using (true);

-- VIEW: Latest position per device
create or replace view public.latest_positions as
select distinct on (p.device_id)
  p.id, p.device_id, p.lat, p.lng, p.speed, p.course,
  p.altitude, p.accuracy, p.battery, p.satellites,
  p.signal, p.attributes, p.recorded_at,
  d.name  as device_name,
  d.icon  as device_icon,
  d.color as device_color,
  d.plate as device_plate,
  d.status as device_status
from public.positions p
join public.devices d on d.id = p.device_id
order by p.device_id, p.recorded_at desc;

-- AUTO-PROFILE trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'driver')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

select 'Tabelat u krijuan me sukses!' as rezultati;
