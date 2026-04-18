-- ============================================================
-- TrackAR Manager - Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable PostGIS for geography (optional but recommended)
-- create extension if not exists postgis;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  role text not null default 'driver' check (role in ('admin', 'driver', 'viewer')),
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 
          coalesce(new.raw_user_meta_data->>'role', 'driver'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- DEVICES
-- ============================================================
create table public.devices (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  identifier text not null unique, -- unique token for GPS client
  plate text,
  icon text default '🚗',
  color text default '#00FF87',
  owner_id uuid references public.profiles(id),
  status text default 'offline' check (status in ('online', 'idle', 'offline')),
  last_seen timestamptz,
  created_at timestamptz default now()
);

alter table public.devices enable row level security;

create policy "Admins manage all devices"
  on public.devices for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Drivers see own device"
  on public.devices for select using (owner_id = auth.uid());

-- ============================================================
-- POSITIONS (GPS updates from client)
-- ============================================================
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

create policy "Admins see all positions"
  on public.positions for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Drivers see own device positions"
  on public.positions for select using (
    exists (
      select 1 from public.devices
      where id = device_id and owner_id = auth.uid()
    )
  );

create policy "Client can insert positions"
  on public.positions for insert with check (true);

-- Index for fast queries
create index idx_positions_device_time on public.positions(device_id, recorded_at desc);
create index idx_positions_recent on public.positions(recorded_at desc);

-- ============================================================
-- LATEST POSITIONS VIEW (for live map)
-- ============================================================
create view public.latest_positions as
select distinct on (p.device_id)
  p.*,
  d.name as device_name,
  d.icon as device_icon,
  d.color as device_color,
  d.plate as device_plate,
  d.status as device_status
from public.positions p
join public.devices d on d.id = p.device_id
order by p.device_id, p.recorded_at desc;

-- ============================================================
-- GEOFENCES
-- ============================================================
create table public.geofences (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null default 'circle' check (type in ('circle', 'polygon')),
  center_lat double precision,
  center_lng double precision,
  radius integer default 500, -- meters (for circle type)
  polygon_coords jsonb,        -- array of {lat,lng} (for polygon type)
  color text default '#4DA6FF',
  active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.geofences enable row level security;

create policy "Admins manage geofences"
  on public.geofences for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "All users can view active geofences"
  on public.geofences for select using (active = true);

-- ============================================================
-- GEOFENCE <-> DEVICE (many-to-many)
-- ============================================================
create table public.geofence_devices (
  geofence_id uuid references public.geofences(id) on delete cascade,
  device_id uuid references public.devices(id) on delete cascade,
  primary key (geofence_id, device_id)
);

alter table public.geofence_devices enable row level security;

create policy "Admins manage geofence_devices"
  on public.geofence_devices for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- EVENTS / ALERTS
-- ============================================================
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

create policy "Admins see all events"
  on public.events for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Client can insert events"
  on public.events for insert with check (true);

-- ============================================================
-- TRIPS (auto-computed)
-- ============================================================
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

create policy "Admins manage trips"
  on public.trips for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Drivers see own trips"
  on public.trips for select using (
    exists (
      select 1 from public.devices
      where id = device_id and owner_id = auth.uid()
    )
  );

-- ============================================================
-- REALTIME: Enable for live updates
-- ============================================================
alter publication supabase_realtime add table public.positions;
alter publication supabase_realtime add table public.devices;
alter publication supabase_realtime add table public.events;

-- ============================================================
-- API ENDPOINT: upsert position from GPS client (anon key)
-- ============================================================
create or replace function public.upsert_position(
  p_identifier text,
  p_lat double precision,
  p_lng double precision,
  p_speed double precision default 0,
  p_course double precision default 0,
  p_altitude double precision default 0,
  p_accuracy double precision default 0,
  p_battery integer default null,
  p_satellites integer default null
)
returns json language plpgsql security definer as $$
declare
  v_device public.devices;
begin
  -- Find device by identifier
  select * into v_device from public.devices where identifier = p_identifier;
  if not found then
    return json_build_object('error', 'Device not found');
  end if;

  -- Insert position
  insert into public.positions (device_id, lat, lng, speed, course, altitude, accuracy, battery, satellites)
  values (v_device.id, p_lat, p_lng, p_speed, p_course, p_altitude, p_accuracy, p_battery, p_satellites);

  -- Update device status
  update public.devices
  set status = case when p_speed > 1 then 'online' else 'idle' end,
      last_seen = now()
  where id = v_device.id;

  return json_build_object('success', true, 'device_id', v_device.id);
end;
$$;

-- Grant anon access to this function (for GPS client)
grant execute on function public.upsert_position to anon;

-- ============================================================
-- SAMPLE DATA (optional - remove in production)
-- ============================================================
-- Insert after creating your first admin user via Auth
-- insert into public.devices (name, identifier, plate, icon, color, status) values
--   ('Furgon #01', 'device-token-001', 'AA 001 BB', '🚐', '#00FF87', 'online'),
--   ('Kamion #05', 'device-token-005', 'AA 050 BC', '🚛', '#4DA6FF', 'online'),
--   ('Makina #12', 'device-token-012', 'TR 120 AA', '🚗', '#FFB800', 'idle');
