import { useEffect, useState, useCallback } from 'react'
import { supabase, TrackEvent } from '@/lib/supabase'

export function useEvents() {
  const [events, setEvents] = useState<TrackEvent[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
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
    fetchEvents()

    // No realtime for events - just poll every 15s to avoid subscribe() error
    const timer = setInterval(fetchEvents, 15000)
    return () => clearInterval(timer)
  }, [fetchEvents])

  async function markAllRead() {
    await supabase.from('events').update({ read: true }).eq('read', false)
    setEvents(prev => prev.map(e => ({ ...e, read: true })))
    setUnreadCount(0)
  }

  return { events, unreadCount, loading, markAllRead, refetch: fetchEvents }
}
