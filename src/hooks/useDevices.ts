import { useEffect, useState, useCallback } from 'react'
import { supabase, Device, LatestPosition } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useDevices() {
  const { isAdmin, user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [latestPositions, setLatestPositions] = useState<Map<string, LatestPosition>>(new Map())
  const [loading, setLoading] = useState(true)

  const fetchDevices = useCallback(async () => {
    const { data } = await supabase.from('devices').select('*').order('created_at')
    if (data) setDevices(data)
  }, [])

  const fetchLatestPositions = useCallback(async () => {
    const { data } = await supabase.from('latest_positions').select('*')
    if (data) {
      const map = new Map<string, LatestPosition>()
      data.forEach((p: LatestPosition) => map.set(p.device_id, p))
      setLatestPositions(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDevices()
    fetchLatestPositions()

    const channel = supabase
      .channel('tracker-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'positions' },
        async (payload) => {
          const pos = payload.new as LatestPosition
          const { data: dev } = await supabase.from('devices').select('*').eq('id', pos.device_id).single()
          if (dev) {
            setLatestPositions(prev => {
              const next = new Map(prev)
              next.set(pos.device_id, {
                ...pos,
                device_name: dev.name, device_icon: dev.icon,
                device_color: dev.color, device_plate: dev.plate,
                device_status: dev.status,
              })
              return next
            })
          }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices' },
        (payload) => {
          const updated = payload.new as Device
          setDevices(prev => prev.map(d => d.id === updated.id ? updated : d))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchDevices, fetchLatestPositions])

  async function addDevice(data: Partial<Device>) {
    const identifier = `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const { error } = await supabase.from('devices').insert({ ...data, identifier })
    if (!error) fetchDevices()
    return { error }
  }

  async function updateDevice(id: string, data: Partial<Device>) {
    const { error } = await supabase.from('devices').update(data).eq('id', id)
    if (!error) fetchDevices()
    return { error }
  }

  async function deleteDevice(id: string) {
    const { error } = await supabase.from('devices').delete().eq('id', id)
    if (!error) setDevices(prev => prev.filter(d => d.id !== id))
    return { error }
  }

  return { devices, latestPositions, loading, addDevice, updateDevice, deleteDevice, refetch: fetchDevices }
}
