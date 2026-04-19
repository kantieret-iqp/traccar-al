import { useState, Suspense, lazy, useEffect, useRef } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { useGeofences } from '@/hooks/useGeofences'
import { useEvents } from '@/hooks/useEvents'
import { Device, LatestPosition } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { Battery, Clock, ChevronUp, ChevronDown } from 'lucide-react'

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
  const [isMobile, setIsMobile] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const positions = Array.from(latestPositions.values())
  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.plate ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const onlineCount = devices.filter(d => d.status === 'online').length
  const idleCount   = devices.filter(d => d.status === 'idle').length
  const selPos = selectedDevice ? latestPositions.get(selectedDevice.id) : null

  function handleSelectOnMap(pos: LatestPosition) {
    const dev = devices.find(d => d.id === pos.device_id)
    if (dev) setSelectedDevice(dev)
  }

  // ── MOBILE layout ──────────────────────────────────────────
  if (isMobile) {
    const PANEL_H    = panelOpen ? '44vh' : '56px'
    const MAP_TOP    = panelOpen ? '44vh' : '56px'
    const NAV_HEIGHT = 56
    const MAP_H      = `calc(100vh - ${panelOpen ? '44vh' : '56px'} - ${NAV_HEIGHT}px)`

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0D1117' }}>

        {/* Device panel — top drawer */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: PANEL_H, zIndex: 10,
          background: '#0D1117',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Toggle bar */}
          <button onClick={() => setPanelOpen(p => !p)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', background: 'transparent', border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
            flexShrink: 0, width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FF87', animation: 'blink 1.5s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#E6EDF3', fontFamily: 'Syne, sans-serif' }}>
                LIVE · {devices.length} pajisje
              </span>
              <span style={{ fontSize: 10, color: '#00FF87', fontFamily: 'monospace' }}>{onlineCount} online</span>
            </div>
            {panelOpen ? <ChevronUp size={16} color="#7D8590" /> : <ChevronDown size={16} color="#7D8590" />}
          </button>

          {/* Device list */}
          {panelOpen && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {/* Search */}
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Kërko pajisje..."
                style={{ width: '100%', background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#E6EDF3', fontFamily: 'monospace', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
              />
              {filtered.map(dev => {
                const pos = latestPositions.get(dev.id)
                const isSelected = selectedDevice?.id === dev.id
                return (
                  <div key={dev.id} onClick={() => setSelectedDevice(isSelected ? null : dev)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                      background: isSelected ? 'rgba(0,255,135,0.08)' : '#161B22',
                      border: isSelected ? '1px solid rgba(0,255,135,0.25)' : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{dev.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#E6EDF3' }}>{dev.name}</div>
                          <div style={{ fontSize: 10, color: '#7D8590', fontFamily: 'monospace' }}>{dev.plate ?? '—'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[dev.status] }} />
                        <span style={{ fontSize: 10, color: STATUS_COLOR[dev.status], fontFamily: 'monospace' }}>{STATUS_LABEL[dev.status]}</span>
                      </div>
                    </div>
                    {pos && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 8 }}>
                        {[
                          { label: 'km/h', val: Math.round(pos.speed), color: dev.status === 'online' ? '#00FF87' : '#7D8590' },
                          { label: 'Kurs', val: COURSE_DIRS[Math.round(pos.course/45)%8], color: '#E6EDF3' },
                          { label: 'Bat', val: pos.battery != null ? `${pos.battery}%` : '—', color: pos.battery && pos.battery < 20 ? '#FF4444' : '#7D8590' },
                        ].map(s => (
                          <div key={s.label} style={{ background: '#0D1117', borderRadius: 6, padding: '5px 8px' }}>
                            <div style={{ fontSize: 8, color: '#7D8590', fontFamily: 'monospace' }}>{s.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* MAP — fills remaining space */}
        <div style={{
          position: 'absolute',
          top: MAP_TOP,
          left: 0, right: 0,
          bottom: 0,
          transition: 'top 0.3s ease',
          overflow: 'hidden',
        }}>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0D1117' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, border: '2px solid #00FF87', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: '#7D8590', fontSize: 13, fontFamily: 'monospace' }}>Duke ngarkuar hartën...</p>
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
        </div>
      </div>
    )
  }

  // ── DESKTOP layout ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 288, minWidth: 288, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', background: '#0D1117', overflow: 'hidden' }}>
        {/* Stats */}
        <div style={{ padding: '12px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FF87' }} className="blink" />
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#7D8590' }}>LIVE TRACKING</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'monospace', color: '#7D8590' }}>{devices.length} pajisje</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[
              { label: 'Online', val: onlineCount, color: '#00FF87' },
              { label: 'Ndalet', val: idleCount, color: '#FFB800' },
              { label: 'Offline', val: devices.length - onlineCount - idleCount, color: '#7D8590' },
            ].map(s => (
              <div key={s.label} style={{ background: '#161B22', borderRadius: 8, padding: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#7D8590' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Kërko pajisje..."
            style={{ width: '100%', background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#E6EDF3', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Device list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div style={{ width: 20, height: 20, border: '2px solid #00FF87', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}
          {filtered.map(dev => {
            const pos = latestPositions.get(dev.id)
            const isSelected = selectedDevice?.id === dev.id
            return (
              <div key={dev.id} onClick={() => setSelectedDevice(isSelected ? null : dev)}
                style={{
                  padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer', position: 'relative',
                  background: isSelected ? 'rgba(0,255,135,0.06)' : 'transparent',
                  borderLeft: isSelected ? '2px solid #00FF87' : '2px solid transparent',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{dev.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#E6EDF3' }}>{dev.name}</div>
                      <div style={{ fontSize: 10, color: '#7D8590', fontFamily: 'monospace' }}>{dev.plate ?? '—'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[dev.status] }} />
                    <span style={{ fontSize: 9, color: STATUS_COLOR[dev.status], fontFamily: 'monospace' }}>{STATUS_LABEL[dev.status]}</span>
                  </div>
                </div>
                {pos && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                    {[
                      { label: 'km/h', val: Math.round(pos.speed), color: '#00FF87' },
                      { label: 'Kurs', val: COURSE_DIRS[Math.round(pos.course/45)%8], color: '#E6EDF3' },
                      { label: 'Bat', val: pos.battery != null ? `${pos.battery}%` : '—', color: '#7D8590' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#161B22', borderRadius: 6, padding: '4px 8px' }}>
                        <div style={{ fontSize: 8, color: '#7D8590', fontFamily: 'monospace' }}>{s.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                )}
                {dev.last_seen && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Clock size={9} color="#7D8590" />
                    <span style={{ fontSize: 9, color: '#7D8590', fontFamily: 'monospace' }}>
                      {formatDistanceToNow(new Date(dev.last_seen), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Events */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#7D8590', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ngjarjet e fundit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 100, overflowY: 'auto' }}>
            {events.slice(0, 5).map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 10, fontFamily: 'monospace' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 3, flexShrink: 0, background: ev.type === 'overspeed' ? '#FF4444' : ev.type === 'online' ? '#00FF87' : '#FFB800' }} />
                <span style={{ color: '#7D8590', flexShrink: 0 }}>{new Date(ev.created_at).toLocaleTimeString('sq', { hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ color: '#E6EDF3' }}>{ev.message}</span>
              </div>
            ))}
            {events.length === 0 && <div style={{ fontSize: 10, color: '#7D8590', fontFamily: 'monospace' }}>Pa ngjarje</div>}
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0D1117' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #00FF87', borderTopColor: 'transparent', borderRadius: '50%' }} />
          </div>
        }>
          <LiveMap
            positions={positions}
            geofences={geofences}
            selectedDevice={selectedDevice}
            onSelectDevice={handleSelectOnMap}
          />
        </Suspense>

        {/* Selected device panel */}
        {selectedDevice && selPos && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16, width: 280,
            background: 'rgba(13,17,23,0.97)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: 16, backdropFilter: 'blur(10px)', zIndex: 1000,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: `${selectedDevice.color}15`, border: `1px solid ${selectedDevice.color}30` }}>
                {selectedDevice.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#E6EDF3' }}>{selectedDevice.name}</div>
                <div style={{ fontSize: 10, color: '#7D8590', fontFamily: 'monospace' }}>{selectedDevice.plate}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Shpejtësia', val: `${Math.round(selPos.speed)} km/h`, color: '#00FF87' },
                { label: 'Drejtimi', val: COURSE_DIRS[Math.round(selPos.course/45)%8], color: '#E6EDF3' },
                { label: 'Lartësia', val: `${Math.round(selPos.altitude)} m`, color: '#7D8590' },
                { label: 'Saktësia', val: `±${Math.round(selPos.accuracy)} m`, color: '#7D8590' },
              ].map(s => (
                <div key={s.label} style={{ background: '#161B22', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 8, color: '#7D8590', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                </div>
              ))}
            </div>
            {selPos.battery != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Battery size={13} color={selPos.battery < 20 ? '#FF4444' : '#7D8590'} />
                <div style={{ flex: 1, height: 4, background: '#161B22', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selPos.battery}%`, background: selPos.battery < 20 ? '#FF4444' : '#00FF87', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: selPos.battery < 20 ? '#FF4444' : '#7D8590' }}>{selPos.battery}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
