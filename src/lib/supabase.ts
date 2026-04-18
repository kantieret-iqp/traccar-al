import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
})

export interface Profile {
  id: string
  full_name: string | null
  role: 'admin' | 'driver' | 'viewer'
  avatar_url: string | null
  created_at: string
}

export interface Device {
  id: string
  name: string
  identifier: string
  plate: string | null
  icon: string
  color: string
  owner_id: string | null
  category: 'vehicle' | 'person' | 'animal' | 'asset'
  status: 'online' | 'idle' | 'offline'
  last_seen: string | null
  created_at: string
}

export interface Position {
  id: number
  device_id: string
  lat: number
  lng: number
  speed: number
  course: number
  altitude: number
  accuracy: number
  battery: number | null
  satellites: number | null
  signal: string | null
  attributes: Record<string, unknown>
  recorded_at: string
}

export interface LatestPosition extends Position {
  device_name: string
  device_icon: string
  device_color: string
  device_plate: string | null
  device_status: string
}

export interface Geofence {
  id: string
  name: string
  type: 'circle' | 'polygon'
  center_lat: number | null
  center_lng: number | null
  radius: number
  polygon_coords: { lat: number; lng: number }[] | null
  color: string
  active: boolean
  created_by: string | null
  created_at: string
}

export interface TrackEvent {
  id: number
  device_id: string
  geofence_id: string | null
  type: 'geofence_enter' | 'geofence_exit' | 'overspeed' | 'online' | 'offline' | 'low_battery'
  message: string | null
  lat: number | null
  lng: number | null
  read: boolean
  created_at: string
}

export interface Trip {
  id: string
  device_id: string
  start_at: string
  end_at: string | null
  distance_km: number
  avg_speed: number
  max_speed: number
  start_lat: number | null
  start_lng: number | null
  end_lat: number | null
  end_lng: number | null
  created_at: string
}
