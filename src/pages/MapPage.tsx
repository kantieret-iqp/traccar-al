import { useState, Suspense, lazy } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { useGeofences } from '@/hooks/useGeofences'
import { useEvents } from '@/hooks/useEvents'
import { Device, LatestPosition } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { Signal, Battery, Navigation, ChevronRight, Wifi, WifiOff, Clock } from 'lucide-react'

const LiveMap = lazy(() => import('@/components/map/LiveMap'))

const STATUS_COLOR: Record<string, string> = {
  online: '#00FF87', idle: '#FFB800', offline: '#7D8590'
}
const STATUS_LABEL: Record<string, string> = {
  online: 'Aktiv', idle: 'Ndalet', offline: 'Offline'
}
const COURSE_DIRS = ['N','NE','E','SE','S','SW','W','NW']

export default function MapPage() {
  const { devices, latestPositions, loading } = useDevices()
  const { geofences } = useGeofences()
  const { events } = useEvents()
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [search, setSearch] = useState('')

  const positions = Array.from(latestPositions.values())
  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.plate ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const onlineCount = devices.filter(d => d.status === 'online').length
  const idleCount = devices.filter(d => d.status === 'idle').length

  function handleSelectOnMap(pos: LatestPosition) {
    const dev = devices.find(d => d.id === pos.device_id)
    if (dev) setSelectedDevice(dev)
  }

  const selPos = selectedDevice ? latestPositions.get(selectedDevice.id) : null

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 flex flex-col border-r border-white/[0.08] bg-[#0D1117]">
        {/* Header stats */}
        <div className="p-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#00FF87] blink" />
            <span className="text-xs font-mono text-[#7D8590]">LIVE TRACKING</span>
            <span className="ml-auto text-[10px] font-mono text-[#7D8590]">{devices.length} pajisje</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Online', val: onlineCount, color: '#00FF87' },
              { label: 'Ndalet', val: idleCount, color: '#FFB800' },
              { label: 'Offline', val: devices.length - onlineCount - idleCount, color: '#7D8590' },
            ].map(s => (
              <div key={s.label} className="bg-[#161B22] rounded-lg p-2 text-center border border-white/[0.05]">
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-[9px] font-mono text-[#7D8590]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/[0.08]">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Kërko pajisje..."
            className="w-full bg-[#161B22] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors placeholder-[#7D8590]"
          />
        </div>

        {/* Device list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="w-5 h-5 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {filtered.map(dev => {
            const pos = latestPositions.get(dev.id)
            const isSelected = selectedDevice?.id === dev.id
            const color = STATUS_COLOR[dev.status]
            const courseDir = pos ? COURSE_DIRS[Math.round(pos.course / 45) % 8] : '—'

            return (
              <div
                key={dev.id}
                onClick={() => setSelectedDevice(isSelected ? null : dev)}
                className={`relative px-3 py-3 border-b border-white/[0.04] cursor-pointer transition-all ${
                  isSelected ? 'bg-[rgba(0,255,135,0.06)]' : 'hover:bg-white/[0.02]'
                }`}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00FF87]" />}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{dev.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-[#E6EDF3]">{dev.name}</div>
                      <div className="text-[10px] font-mono text-[#7D8590]">{dev.plate ?? '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    <span className="text-[9px] font-mono" style={{ color }}>{STATUS_LABEL[dev.status]}</span>
                  </div>
                </div>

                {pos ? (
                  <div className="grid grid-cols-3 gap-1">
                    <div className="bg-[#161B22] rounded px-2 py-1">
                      <div className="text-[8px] font-mono text-[#7D8590]">km/h</div>
                      <div className="text-xs font-bold" style={{ color: dev.status === 'online' ? '#00FF87' : '#7D8590' }}>
                        {Math.round(pos.speed)}
                      </div>
                    </div>
                    <div className="bg-[#161B22] rounded px-2 py-1">
                      <div className="text-[8px] font-mono text-[#7D8590]">Kurs</div>
                      <div className="text-xs font-bold text-[#E6EDF3]">{courseDir}</div>
                    </div>
                    <div className="bg-[#161B22] rounded px-2 py-1">
                      <div className="text-[8px] font-mono text-[#7D8590]">Bat</div>
                      <div className="text-xs font-bold" style={{ color: pos.battery && pos.battery < 20 ? '#FF4444' : '#7D8590' }}>
                        {pos.battery != null ? `${pos.battery}%` : '—'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-[#7D8590]">Pa pozicion</div>
                )}

                {dev.last_seen && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={9} className="text-[#7D8590]" />
                    <span className="text-[9px] font-mono text-[#7D8590]">
                      {formatDistanceToNow(new Date(dev.last_seen), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Recent events */}
        <div className="border-t border-white/[0.08] p-3">
          <div className="text-[9px] font-mono text-[#7D8590] mb-2 uppercase tracking-wider">Ngjarjet e fundit</div>
          <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto">
            {events.slice(0, 5).map(ev => (
              <div key={ev.id} className="flex items-start gap-2 text-[10px] font-mono">
                <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                  ev.type === 'geofence_enter' || ev.type === 'geofence_exit' ? 'bg-[#FFB800]' :
                  ev.type === 'overspeed' ? 'bg-[#FF4444]' :
                  ev.type === 'online' ? 'bg-[#00FF87]' : 'bg-[#7D8590]'
                }`} />
                <span className="text-[#7D8590] flex-shrink-0">{new Date(ev.created_at).toLocaleTimeString('sq', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[#E6EDF3] truncate">{ev.message}</span>
              </div>
            ))}
            {events.length === 0 && <div className="text-[10px] font-mono text-[#7D8590]">Pa ngjarje</div>}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full bg-[#0D1117]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#7D8590] text-sm font-mono">Duke ngarkuar hartën...</p>
            </div>
          </div>
        }>
          <LiveMap
            positions={positions}
            geofences={geofences}
            selectedDevice={selectedDevice}
            onSelectDevice={handleSelectOnMap}
          />
        </Suspense>

        {/* Selected device floating panel */}
        {selectedDevice && selPos && (
          <div className="absolute bottom-4 left-4 w-72 bg-[rgba(13,17,23,0.97)] border border-white/[0.08] rounded-xl p-4 backdrop-blur-md z-[1000] slide-right">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${selectedDevice.color}15`, border: `1px solid ${selectedDevice.color}30` }}>
                {selectedDevice.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-[#E6EDF3]">{selectedDevice.name}</div>
                <div className="text-[10px] font-mono text-[#7D8590]">{selectedDevice.plate}</div>
              </div>
              <div className="w-2 h-2 rounded-full blink" style={{ background: STATUS_COLOR[selectedDevice.status] }} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: 'Shpejtësia', val: `${Math.round(selPos.speed)} km/h`, color: '#00FF87' },
                { label: 'Drejtimi', val: COURSE_DIRS[Math.round(selPos.course/45)%8], color: '#E6EDF3' },
                { label: 'Lartësia', val: `${Math.round(selPos.altitude)} m`, color: '#7D8590' },
                { label: 'Saktësia', val: `±${Math.round(selPos.accuracy)} m`, color: '#7D8590' },
              ].map(s => (
                <div key={s.label} className="bg-[#161B22] rounded-lg p-2 border border-white/[0.05]">
                  <div className="text-[9px] font-mono text-[#7D8590] mb-1">{s.label.toUpperCase()}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] font-mono text-[#7D8590]">
              {selPos.lat.toFixed(5)}° N, {selPos.lng.toFixed(5)}° E
            </div>
            {selPos.battery != null && (
              <div className="flex items-center gap-2 mt-2">
                <Battery size={12} className={selPos.battery < 20 ? 'text-[#FF4444]' : 'text-[#7D8590]'} />
                <div className="flex-1 h-1.5 bg-[#161B22] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${selPos.battery}%`, background: selPos.battery < 20 ? '#FF4444' : '#00FF87' }} />
                </div>
                <span className="text-[10px] font-mono" style={{ color: selPos.battery < 20 ? '#FF4444' : '#7D8590' }}>{selPos.battery}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
