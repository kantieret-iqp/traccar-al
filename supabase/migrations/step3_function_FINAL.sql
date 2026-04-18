-- ============================================================
-- ZGJIDHJA FINALE - Ekzekuto VETEM këtë në SQL Editor
-- Pa asnjë variabël declare - përdor subquery direkt
-- ============================================================

drop function if exists public.upsert_position(text, double precision, double precision, double precision, double precision, double precision, double precision, integer, integer);

create or replace function public.upsert_position(
  p_identifier text,
  p_lat        double precision,
  p_lng        double precision,
  p_speed      double precision default 0,
  p_course     double precision default 0,
  p_altitude   double precision default 0,
  p_accuracy   double precision default 0,
  p_battery    integer          default null,
  p_satellites integer          default null
)
returns json
language sql
security definer
set search_path = public
as $$
  with found_device as (
    select id, name
    from public.devices
    where identifier = p_identifier
    limit 1
  ),
  inserted as (
    insert into public.positions (
      device_id, lat, lng, speed, course,
      altitude, accuracy, battery, satellites
    )
    select
      id, p_lat, p_lng, p_speed, p_course,
      p_altitude, p_accuracy, p_battery, p_satellites
    from found_device
    returning device_id
  ),
  updated as (
    update public.devices
    set
      status    = case when p_speed > 1 then 'online' else 'idle' end,
      last_seen = now()
    where identifier = p_identifier
    returning id, name, status
  )
  select
    case
      when (select count(*) from found_device) = 0
      then json_build_object('error', 'Device not found', 'identifier', p_identifier)
      else json_build_object(
        'success', true,
        'device_id', (select id from updated),
        'device', (select name from updated),
        'status', (select status from updated)
      )
    end;
$$;

grant execute on function public.upsert_position to anon;
grant execute on function public.upsert_position to authenticated;

-- Verifiko
select routine_name, routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'upsert_position';
