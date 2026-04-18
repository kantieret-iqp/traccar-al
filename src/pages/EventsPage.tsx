import { useEvents } from '@/hooks/useEvents'
import { TrackEvent } from '@/lib/supabase'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const EVENT_CONFIG: Record<TrackEvent['type'], { label: string; color: string; emoji: string }> = {
  geofence_enter: { label: 'Hyrje Zonë', color: '#FFB800', emoji: '📍' },
  geofence_exit:  { label: 'Dalje Zonë', color: '#FF6B6B', emoji: '🚪' },
  overspeed:      { label: 'Tejkalim Shpejtësie', color: '#FF4444', emoji: '⚡' },
  online:         { label: 'U Aktivizua', color: '#00FF87', emoji: '🟢' },
  offline:        { label: 'U Çaktivizua', color: '#7D8590', emoji: '🔴' },
  low_battery:    { label: 'Bateri e Ulët', color: '#FF4444', emoji: '🔋' },
}

export default function EventsPage() {
  const { events, unreadCount, loading, markAllRead } = useEvents()

  return (
    <div className="h-full flex flex-col bg-[#0D1117] p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#E6EDF3]">Ngjarjet & Alarmet</h1>
          <p className="text-sm text-[#7D8590] font-mono mt-0.5">
            {unreadCount > 0 ? <span className="text-[#FF4444]">{unreadCount} të palexuara</span> : 'Të gjitha të lexuara'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm text-[#7D8590] hover:text-[#E6EDF3] hover:border-white/20 transition-all">
            <CheckCheck size={15} />Shëno të lexuara
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(EVENT_CONFIG).slice(0, 3).map(([type, cfg]) => {
          const count = events.filter(e => e.type === type).length
          return (
            <div key={type} className="bg-[#161B22] border border-white/[0.05] rounded-xl p-4">
              <div className="text-2xl mb-1">{cfg.emoji}</div>
              <div className="text-xl font-bold" style={{ color: cfg.color }}>{count}</div>
              <div className="text-xs font-mono text-[#7D8590]">{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* Events list */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map(ev => {
            const cfg = EVENT_CONFIG[ev.type]
            return (
              <div key={ev.id} className={`flex items-start gap-4 bg-[#161B22] border rounded-xl px-4 py-3 transition-all ${!ev.read ? 'border-white/[0.1]' : 'border-white/[0.04] opacity-70'}`}>
                <div className="text-xl mt-0.5 flex-shrink-0">{cfg.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                    {!ev.read && <div className="w-1.5 h-1.5 rounded-full bg-[#00FF87] blink" />}
                  </div>
                  <div className="text-sm text-[#E6EDF3]">{ev.message ?? '—'}</div>
                  {ev.lat && ev.lng && (
                    <div className="text-[10px] font-mono text-[#7D8590] mt-1">{ev.lat.toFixed(4)}° N, {ev.lng.toFixed(4)}° E</div>
                  )}
                </div>
                <div className="text-[10px] font-mono text-[#7D8590] flex-shrink-0 text-right">
                  <div>{format(new Date(ev.created_at), 'HH:mm')}</div>
                  <div className="mt-0.5">{formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}</div>
                </div>
              </div>
            )
          })}
          {events.length === 0 && (
            <div className="text-center py-16">
              <BellOff size={32} className="text-[#7D8590] mx-auto mb-3" />
              <div className="text-sm text-[#7D8590] font-mono">Nuk ka ngjarje ende</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
