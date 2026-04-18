-- ============================================================
-- FIX: Ekzekuto këtë SQL veç e veç në Supabase SQL Editor
-- Pas ekzekutimit të 001_schema.sql
-- ============================================================

-- Fshi funksionin e vjetër nëse ekziston
drop function if exists public.upsert_position;

-- Krijo funksionin me sintaksë të korrigjuar
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
as $$
declare
  v_device_id  uuid;
  v_device_name text;
begin
  -- Gjej pajisjen me identifier
  select id, name
    into v_device_id, v_device_name
    from public.devices
   where identifier = p_identifier
   limit 1;

  -- Nëse nuk gjendet, kthe error
  if v_device_id is null then
    return json_build_object('error', 'Device not found', 'identifier', p_identifier);
  end if;

  -- Shto pozicionin e ri
  insert into public.positions (
    device_id, lat, lng, speed, course,
    altitude, accuracy, battery, satellites
  ) values (
    v_device_id, p_lat, p_lng, p_speed, p_course,
    p_altitude, p_accuracy, p_battery, p_satellites
  );

  -- Përditëso statusin e pajisjes
  update public.devices
     set status    = case when p_speed > 1 then 'online' else 'idle' end,
         last_seen = now()
   where id = v_device_id;

  return json_build_object(
    'success',   true,
    'device_id', v_device_id,
    'device',    v_device_name
  );
end;
$$;

-- Jep akses anon (për GPS client pa login)
grant execute on function public.upsert_position to anon;
grant execute on function public.upsert_position to authenticated;

-- Verifiko që funksioni u krijua
select routine_name, routine_type
  from information_schema.routines
 where routine_schema = 'public'
   and routine_name = 'upsert_position';
