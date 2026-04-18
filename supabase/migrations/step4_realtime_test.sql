-- ============================================================
-- HAPI 4: Aktivizo Realtime + Test fnal
-- Ekzekuto KETë FUNDIT
-- ============================================================

-- Realtime channels
alter publication supabase_realtime add table public.positions;
alter publication supabase_realtime add table public.devices;
alter publication supabase_realtime add table public.events;

-- ============================================================
-- TEST: Shto pajisje demo dhe testo funksionin
-- (opsionale - fshije para production)
-- ============================================================

-- Shto pajisje demo
insert into public.devices (name, identifier, plate, icon, color, status)
values
  ('Furgon #01',      'demo-token-001', 'AA 001 BB', '🚐', '#00FF87', 'offline'),
  ('Kamion #05',      'demo-token-005', 'AA 050 BC', '🚛', '#4DA6FF', 'offline'),
  ('Makina #12',      'demo-token-012', 'TR 120 AA', '🚗', '#FFB800', 'offline'),
  ('Motoçikletë #3',  'demo-token-003', 'AA 003 MC', '🏍️', '#FF6B6B', 'offline')
on conflict (identifier) do nothing;

-- Test funksionin me Furgon #01
select public.upsert_position(
  'demo-token-001',  -- identifier
  41.3275,           -- lat (Tiranë)
  19.8187,           -- lng
  45.5,              -- speed km/h
  90.0,              -- course (Lindje)
  120.0,             -- altitude m
  5.0,               -- accuracy m
  85,                -- battery %
  8                  -- satellites
);

-- Verifiko: duhet të shohësh pozicionin e ri
select d.name, d.status, d.last_seen,
       p.lat, p.lng, p.speed, p.recorded_at
  from public.devices d
  join public.positions p on p.device_id = d.id
 order by p.recorded_at desc
 limit 5;
