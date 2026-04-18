-- ============================================================
-- HAPI 3: Krijo funksionin upsert_position
-- Ekzekuto KETë PAS step2_tables.sql
-- ============================================================

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
language plpgsql
security definer
set search_path = public
as $$
declare
  _device_id   uuid;
  _device_name text;
  _new_status  text;
begin
  -- Gjej device_id nga identifier
  select id, name
    into _device_id, _device_name
    from public.devices
   where identifier = p_identifier
   limit 1;

  -- Pajisja nuk u gjet
  if _device_id is null then
    return json_build_object(
      'error',      'Device not found',
      'identifier', p_identifier
    );
  end if;

  -- Llogarit statusin e ri
  _new_status := case when p_speed > 1 then 'online' else 'idle' end;

  -- Shto pozicionin
  insert into public.positions (
    device_id,   lat,        lng,
    speed,       course,     altitude,
    accuracy,    battery,    satellites
  ) values (
    _device_id,  p_lat,      p_lng,
    p_speed,     p_course,   p_altitude,
    p_accuracy,  p_battery,  p_satellites
  );

  -- Përditëso pajisjen
  update public.devices
     set status    = _new_status,
         last_seen = now()
   where id = _device_id;

  -- Kthe sukses
  return json_build_object(
    'success',   true,
    'device_id', _device_id,
    'device',    _device_name,
    'status',    _new_status
  );

exception when others then
  return json_build_object(
    'error',   SQLERRM,
    'detail',  SQLSTATE
  );
end;
$$;

-- Akses për GPS client (pa login)
grant execute on function public.upsert_position to anon;
grant execute on function public.upsert_position to authenticated;

-- Test: duhet të kthejë "upsert_position | FUNCTION"
select routine_name, routine_type
  from information_schema.routines
 where routine_schema = 'public'
   and routine_name   = 'upsert_position';
