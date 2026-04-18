import { useState, useEffect, useCallback } from 'react'
import { supabase, Profile } from '@/lib/supabase'

export interface Watcher {
  device_id: string
  user_id: string
  can_see_history: boolean
  added_at: string
  profile?: Profile
}

export function useWatchers(deviceId: string | null) {
  const [watchers, setWatchers] = useState<Watcher[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  const fetchWatchers = useCallback(async () => {
    if (!deviceId) return
    setLoading(true)
    const { data } = await supabase
      .from('device_watchers')
      .select('*')
      .eq('device_id', deviceId)
    if (data) {
      // enrich with profile info
      const enriched = await Promise.all(data.map(async (w: Watcher) => {
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', w.user_id).single()
        return { ...w, profile: profile ?? undefined }
      }))
      setWatchers(enriched)
    }
    setLoading(false)
  }, [deviceId])

  const fetchAllUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    if (data) setAllUsers(data)
  }, [])

  useEffect(() => {
    fetchWatchers()
    fetchAllUsers()
  }, [fetchWatchers, fetchAllUsers])

  async function addWatcher(userId: string, canSeeHistory = true) {
    if (!deviceId) return
    await supabase.rpc('add_device_watcher', {
      p_device_id: deviceId,
      p_user_id: userId,
      p_history: canSeeHistory,
    })
    fetchWatchers()
  }

  async function removeWatcher(userId: string) {
    if (!deviceId) return
    await supabase.rpc('remove_device_watcher', {
      p_device_id: deviceId,
      p_user_id: userId,
    })
    setWatchers(prev => prev.filter(w => w.user_id !== userId))
  }

  async function toggleHistory(userId: string, value: boolean) {
    if (!deviceId) return
    await supabase.rpc('add_device_watcher', {
      p_device_id: deviceId,
      p_user_id: userId,
      p_history: value,
    })
    setWatchers(prev => prev.map(w => w.user_id === userId ? { ...w, can_see_history: value } : w))
  }

  return { watchers, allUsers, loading, addWatcher, removeWatcher, toggleHistory }
}
