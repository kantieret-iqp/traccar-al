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

const BOTTOM_NAV_H = 56
const PANEL_OPEN_H = 200  // px — fixed height for device panel on mobile

export default function MapPage() {
  const { devices, latestPositions, loading } = useDevices()
  const { geofences } = useGeofences()
  const { events } = useEvents()
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [panelOpen, setPanelOpen] = useState(true)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
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
  const selPos      = selectedDevice ? latestPositions.get(selectedDevice.id) : null

  function handleSelectOnMap(pos: LatestPosition) {
    const dev = devices.find(d => d.id === pos.device_id)
    if (dev) setSelectedDevice(dev)
  }

  // ── MOBILE ─────────────────────────────────────────────────
  if (isMobile) {
    // Total available = viewport minus bottom nav
    const totalH   = window.innerHeight - BOTTOM_NAV_H
    const headerH  = 44  // toggle bar
    const panelH   = panelOpen ? PANEL_OPEN_H : 0
    const mapH     = totalH - headerH - panelH

    return (
      <div style={{ width: '100%', height: totalH, display: 'flex', flexDirection: 'column', background: '#0D1117', overflow: 'hidden' }}>

        {/* Toggle bar */}
        <button onClick={() => setPanelOpen(p => !p)} style={{
          height: headerH, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px',
          background: '#0D1117', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer', width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FF87' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E6EDF3', fontFamily: 'Syne,sans-serif' }}>
              LIVE · {devices.length} pajisje
            </span>
            <span style={{ fontSize: 11, color: '#00FF87', fontFamily: 'monospace' }}>{onlineCount} online</span>
          </div>
          {panelOpen ? <ChevronUp size={16} color="#7D8590" /> : <ChevronDown size={16} color="#7D8590" />}
        </button>

        {/* Device panel */}
        {panelOpen && (
          <div style={{ height: PANEL_OPEN_H, flexShrink: 0, overflowY: 'auto', background: '#0D1117', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ padding: '8px 12px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Kërko..." style={{
                  width: '100%', background: '#161B22', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#E6EDF3',
                  fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 8,
                }}
              />
              {filtered.map(dev => {
                const pos = latestPositions.get(dev.id)
                const isSelected = selectedDevice?.id === dev.id
                return (
                  <div key={dev.id} onClick={() => setSelectedDevice(isSelected ? null : dev)} style={{
                    padding: '8px 10px', borderRadius: 8, marginBottom: 5, cursor: 'pointer',
                    background: isSelected ? 'rgba(0,255,135,0.08)' : '#161B22',
                    border: isSelected ? '1px solid rgba(0,255,135,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{dev.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#E6EDF3' }}>{dev.name}</div>
                        {pos && <div style={{ fontSize: 10, color: '#00FF87', fontFamily: 'monospace' }}>{Math.round(pos.speed)} km/h · {COURSE_DIRS[Math.round(pos.course/45)%8]}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[dev.status] }} />
                      <span style={{ fontSize: 10, color: STATUS_COLOR[dev.status], fontFamily: 'monospace' }}>{STATUS_LABEL[dev.status]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* MAP — explicit pixel height */}
        <div style={{ height: mapH, flexShrink: 0, position: 'relative' }}>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0D1117' }}>
              <div style={{ width: 28, height: 28, border: '2px solid #00FF87', borderTopColor: 'transparent', borderRadius: '50%' }} />
            </div>
          }>
            <LiveMap positions={positions} geofences={geofences} selectedDevice={selectedDevice} onSelectDevice={handleSelectOnMap} />
          </Suspense>
        </div>

      </div>
    )
  }

  // ── DESKTOP ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 288, minWidth: 288, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', background: '#0D1117', overflow: 'hidden' }}>
        <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
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
              <div key={s.label} style={{ background: '#161B22', borderRadius: 8, padding: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#7D8590' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Kërko pajisje..."
            style={{ width: '100%', background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#E6EDF3', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(dev => {
            const pos = latestPositions.get(dev.id)
            const isSelected = selectedDevice?.id === dev.id
            return (
              <div key={dev.id} onClick={() => setSelectedDevice(isSelected ? null : dev)} style={{
                padding: 12, borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                background: isSelected ? 'rgba(0,255,135,0.06)' : 'transparent',
                borderLeft: isSelected ? '2px solid #00FF87' : '2px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pos ? 8 : 0 }}>
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
                    <span style={{ fontSize: 9, color: '#7D8590', fontFamily: 'monospace' }}>{formatDistanceToNow(new Date(dev.last_seen), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#7D8590', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ngjarjet e fundit</div>
          {events.slice(0, 4).map(ev => (
            <div key={ev.id} style={{ display: 'flex', gap: 6, fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 3, flexShrink: 0, background: ev.type === 'overspeed' ? '#FF4444' : ev.type === 'online' ? '#00FF87' : '#FFB800' }} />
              <span style={{ color: '#7D8590', flexShrink: 0 }}>{new Date(ev.created_at).toLocaleTimeString('sq', { hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ color: '#E6EDF3' }}>{ev.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div style={{ width: 32, height: 32, border: '2px solid #00FF87', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
          <LiveMap positions={positions} geofences={geofences} selectedDevice={selectedDevice} onSelectDevice={handleSelectOnMap} />
        </Suspense>
        {selectedDevice && selPos && (
          <div style={{ position: 'absolute', bottom: 16, left: 16, width: 280, background: 'rgba(13,17,23,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, backdropFilter: 'blur(10px)', zIndex: 1000 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: `${selectedDevice.color}15`, border: `1px solid ${selectedDevice.color}30` }}>{selectedDevice.icon}</div>
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
