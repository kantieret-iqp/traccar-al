import { useEffect, useState, useCallback } from 'react'
import { supabase, Geofence } from '@/lib/supabase'

export function useGeofences() {
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('geofences').select('*').order('created_at', { ascending: false })
    if (data) setGeofences(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addGeofence(data: Partial<Geofence>) {
    const { error } = await supabase.from('geofences').insert(data)
    if (!error) fetch()
    return { error }
  }

  async function toggleGeofence(id: string, active: boolean) {
    const { error } = await supabase.from('geofences').update({ active }).eq('id', id)
    if (!error) setGeofences(prev => prev.map(g => g.id === id ? { ...g, active } : g))
    return { error }
  }

  async function deleteGeofence(id: string) {
    const { error } = await supabase.from('geofences').delete().eq('id', id)
    if (!error) setGeofences(prev => prev.filter(g => g.id !== id))
    return { error }
  }

  return { geofences, loading, addGeofence, toggleGeofence, deleteGeofence, refetch: fetch }
}
