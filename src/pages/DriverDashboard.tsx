import { useState, Suspense, lazy } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { useAuth } from '@/hooks/useAuth'
import { useEvents } from '@/hooks/useEvents'
import { Device, LatestPosition } from '@/lib/supabase'
import { formatDistanceToNow, format } from 'date-fns'
import { Battery, Navigation2, Gauge, MapPin, Radio, Bell } from 'lucide-react'

const LiveMap = lazy(() => import('@/components/map/LiveMap'))

const COURSE_DIRS = ['N','NE','E','SE','S','SW','W','NW']
const STATUS_COLOR: Record<string, string> = { online: '#00FF87', idle: '#FFB800', offline: '#7D8590' }
const STATUS_LABEL: Record<string, string> = { online: 'Aktiv', idle: 'Ndalet', offline: 'Offline' }

export default function DriverDashboard() {
  const { profile } = useAuth()
  const { devices, latestPositions, loading } = useDevices()
  const { events } = useEvents()
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  const positions = Array.from(latestPositions.values())
  const selPos = selectedDevice ? latestPositions.get(selectedDevice.id) : null

  // Auto-select first device
  if (!selectedDevice && devices.length > 0) {
    setSelectedDevice(devices[0])
  }

  const myEvents = events.filter(e => devices.some(d => d.id === e.device_id))

  return (
    <div className="h-full flex flex-col bg-[#0D1117] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div>
          <h1 className="text-sm font-bold text-[#E6EDF3]">
            Mirë se erdhe, {profile?.full_name?.split(' ')[0] ?? 'Driver'} 👋
          </h1>
          <p className="text-[10px] font-mono text-[#7D8590]">
            {devices.length} pajisje të mia · {devices.filter(d => d.status === 'online').length} aktive
          </p>
        </div>
        <div className="flex items-center gap-2">
          {myEvents.filter(e => !e.read).length > 0 && (
            <div className="flex items-center gap-1.5 bg-[rgba(255,68,68,0.1)] border border-[rgba(255,68,68,0.2)] rounded-lg px-2.5 py-1.5">
              <Bell size={12} className="text-[#FF4444]" />
              <span className="text-xs font-mono text-[#FF4444]">{myEvents.filter(e => !e.read).length} njoftime</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: device list + stats */}
        <div className="w-64 flex flex-col border-r border-white/[0.06] overflow-y-auto">
          {/* My devices */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="text-[9px] font-mono text-[#7D8590] uppercase tracking-wider mb-2">Pajisjet e mia</div>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-2xl mb-2">📡</div>
                <div className="text-xs font-mono text-[#7D8590]">Nuk keni pajisje të caktuara.</div>
                <div className="text-[10px] font-mono text-[#7D8590] mt-1">Kontaktoni administratorin.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {devices.map(dev => {
                  const pos = latestPositions.get(dev.id)
                  const isSelected = selectedDevice?.id === dev.id
                  return (
                    <div key={dev.id} onClick={() => setSelectedDevice(dev)}
                      className={`rounded-xl p-2.5 cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[rgba(0,255,135,0.06)] border-[rgba(0,255,135,0.2)]'
                          : 'bg-[#161B22] border-white/[0.05] hover:border-white/10'
                      }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{dev.icon}</span>
                          <span className="text-xs font-semibold text-[#E6EDF3]">{dev.name}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[dev.status] }} />
                      </div>
                      {pos ? (
                        <div className="grid grid-cols-2 gap-1">
                          <div className="bg-[#0D1117] rounded px-1.5 py-1">
                            <div className="text-[8px] font-mono text-[#7D8590]">km/h</div>
                            <div className="text-xs font-bold" style={{ color: dev.status === 'online' ? '#00FF87' : '#7D8590' }}>
                              {Math.round(pos.speed)}
                            </div>
                          </div>
                          <div className="bg-[#0D1117] rounded px-1.5 py-1">
                            <div className="text-[8px] font-mono text-[#7D8590]">Bat</div>
                            <div className="text-xs font-bold" style={{ color: pos.battery && pos.battery < 20 ? '#FF4444' : '#7D8590' }}>
                              {pos.battery != null ? `${pos.battery}%` : '—'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-[#7D8590]">Pa pozicion</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent events for my devices */}
          <div className="p-3">
            <div className="text-[9px] font-mono text-[#7D8590] uppercase tracking-wider mb-2">Ngjarjet e fundit</div>
            <div className="flex flex-col gap-1.5">
              {myEvents.slice(0, 8).map(ev => (
                <div key={ev.id} className="flex items-start gap-2 text-[10px] font-mono">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                    ev.type === 'geofence_enter' ? 'bg-[#FFB800]' :
                    ev.type === 'geofence_exit' ? 'bg-[#FF6B6B]' :
                    ev.type === 'overspeed' ? 'bg-[#FF4444]' :
                    ev.type === 'online' ? 'bg-[#00FF87]' : 'bg-[#7D8590]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[#7D8590]">{format(new Date(ev.created_at), 'HH:mm')}</div>
                    <div className="text-[#E6EDF3] truncate">{ev.message}</div>
                  </div>
                </div>
              ))}
              {myEvents.length === 0 && <div className="text-[10px] font-mono text-[#7D8590]">Pa ngjarje</div>}
            </div>
          </div>
        </div>

        {/* Right: map + selected device panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full bg-[#0D1117]">
                <div className="w-8 h-8 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <LiveMap
                positions={positions}
                geofences={[]}
                selectedDevice={selectedDevice}
                onSelectDevice={(pos: LatestPosition) => {
                  const dev = devices.find(d => d.id === pos.device_id)
                  if (dev) setSelectedDevice(dev)
                }}
              />
            </Suspense>
          </div>

          {/* Selected device detail strip */}
          {selectedDevice && selPos && (
            <div className="border-t border-white/[0.06] bg-[#161B22] p-3 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedDevice.icon}</span>
                <div>
                  <div className="text-sm font-bold text-[#E6EDF3]">{selectedDevice.name}</div>
                  <div className="text-[10px] font-mono" style={{ color: STATUS_COLOR[selectedDevice.status] }}>
                    {STATUS_LABEL[selectedDevice.status]}
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-white/[0.08]" />

              {[
                { icon: Gauge, label: 'Shpejtësia', val: `${Math.round(selPos.speed)} km/h`, color: '#00FF87' },
                { icon: Navigation2, label: 'Drejtimi', val: COURSE_DIRS[Math.round(selPos.course / 45) % 8], color: '#E6EDF3' },
                { icon: MapPin, label: 'Koordinatat', val: `${selPos.lat.toFixed(4)}° N`, color: '#7D8590' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <s.icon size={14} style={{ color: s.color }} />
                  <div>
                    <div className="text-[8px] font-mono text-[#7D8590] uppercase">{s.label}</div>
                    <div className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.val}</div>
                  </div>
                </div>
              ))}

              {selPos.battery != null && (
                <>
                  <div className="h-8 w-px bg-white/[0.08]" />
                  <div className="flex items-center gap-2">
                    <Battery size={14} style={{ color: selPos.battery < 20 ? '#FF4444' : '#7D8590' }} />
                    <div>
                      <div className="text-[8px] font-mono text-[#7D8590] uppercase">Bateria</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${selPos.battery}%`,
                            background: selPos.battery < 20 ? '#FF4444' : '#00FF87'
                          }} />
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color: selPos.battery < 20 ? '#FF4444' : '#E6EDF3' }}>
                          {selPos.battery}%
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="ml-auto">
                <div className="text-[9px] font-mono text-[#7D8590]">
                  {formatDistanceToNow(new Date(selPos.recorded_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
