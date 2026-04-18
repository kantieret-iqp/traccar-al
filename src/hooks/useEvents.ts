import { useEffect, useState, useCallback } from 'react'
import { supabase, TrackEvent } from '@/lib/supabase'

export function useEvents() {
  const [events, setEvents] = useState<TrackEvent[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) {
      setEvents(data)
      setUnreadCount(data.filter(e => !e.read).length)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()

    const channel = supabase
      .channel('events-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          const ev = payload.new as TrackEvent
          setEvents(prev => [ev, ...prev.slice(0, 49)])
          setUnreadCount(prev => prev + 1)
        }
      ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetch])

  async function markAllRead() {
    await supabase.from('events').update({ read: true }).eq('read', false)
    setEvents(prev => prev.map(e => ({ ...e, read: true })))
    setUnreadCount(0)
  }

  return { events, unreadCount, loading, markAllRead, refetch: fetch }
}
