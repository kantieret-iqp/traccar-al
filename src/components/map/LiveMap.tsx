import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { LatestPosition, Geofence, Device } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createDeviceIcon(icon: string, color: string, selected: boolean) {
  const size = selected ? 44 : 36
  const pulse = selected ? `
    <div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid ${color};opacity:0.4;animation:pulse-ring 2s ease-out infinite;pointer-events:none"></div>
  ` : ''
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px">
        ${pulse}
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color}20;border:${selected ? 2 : 1.5}px solid ${color};
          display:flex;align-items:center;justify-content:center;
          font-size:${selected ? 18 : 14}px;cursor:pointer;
          box-shadow:0 0 ${selected ? 12 : 6}px ${color}40;
        ">${icon}</div>
      </div>
    `
  })
}

function FlyToDevice({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 1 })
  }, [position, map])
  return null
}

interface LiveMapProps {
  positions: LatestPosition[]
  geofences: Geofence[]
  selectedDevice: Device | null
  onSelectDevice: (pos: LatestPosition) => void
}

const COURSE_DIRS = ['N','NE','E','SE','S','SW','W','NW']

export default function LiveMap({ positions, geofences, selectedDevice, onSelectDevice }: LiveMapProps) {
  const flyTarget = selectedDevice
    ? positions.find(p => p.device_id === selectedDevice.id)
    : null

  return (
    <MapContainer
      center={[41.328, 19.818]}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Fly to selected device */}
      <FlyToDevice position={flyTarget ? [flyTarget.lat, flyTarget.lng] : null} />

      {/* Geofence circles */}
      {geofences.filter(g => g.active && g.type === 'circle' && g.center_lat && g.center_lng).map(g => (
        <Circle
          key={g.id}
          center={[g.center_lat!, g.center_lng!]}
          radius={g.radius}
          pathOptions={{ color: g.color, fillColor: g.color, fillOpacity: 0.08, weight: 1.5, dashArray: '6 4' }}
        />
      ))}

      {/* Device markers */}
      {positions.map(pos => {
        const isSelected = selectedDevice?.id === pos.device_id
        const courseDir = COURSE_DIRS[Math.round(pos.course / 45) % 8]
        return (
          <Marker
            key={pos.device_id}
            position={[pos.lat, pos.lng]}
            icon={createDeviceIcon(pos.device_icon, pos.device_color, isSelected)}
            eventHandlers={{ click: () => onSelectDevice(pos) }}
            zIndexOffset={isSelected ? 1000 : 0}
          >
            <Popup>
              <div style={{ fontFamily: 'Syne, sans-serif', minWidth: 180, background: '#161B22', color: '#E6EDF3' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{pos.device_icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{pos.device_name}</div>
                    <div style={{ fontSize: 11, color: '#7D8590', fontFamily: 'JetBrains Mono' }}>{pos.device_plate}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono' }}>
                  <div style={{ background: '#0D1117', borderRadius: 6, padding: '5px 8px' }}>
                    <div style={{ color: '#7D8590', fontSize: 9, marginBottom: 2 }}>SHPEJTËSIA</div>
                    <div style={{ color: '#00FF87', fontWeight: 600 }}>{Math.round(pos.speed)} km/h</div>
                  </div>
                  <div style={{ background: '#0D1117', borderRadius: 6, padding: '5px 8px' }}>
                    <div style={{ color: '#7D8590', fontSize: 9, marginBottom: 2 }}>KURSI</div>
                    <div style={{ color: '#E6EDF3', fontWeight: 600 }}>{courseDir} {Math.round(pos.course)}°</div>
                  </div>
                  <div style={{ background: '#0D1117', borderRadius: 6, padding: '5px 8px' }}>
                    <div style={{ color: '#7D8590', fontSize: 9, marginBottom: 2 }}>LAT</div>
                    <div>{pos.lat.toFixed(5)}</div>
                  </div>
                  <div style={{ background: '#0D1117', borderRadius: 6, padding: '5px 8px' }}>
                    <div style={{ color: '#7D8590', fontSize: 9, marginBottom: 2 }}>LNG</div>
                    <div>{pos.lng.toFixed(5)}</div>
                  </div>
                </div>
                {pos.battery != null && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#7D8590', fontFamily: 'JetBrains Mono' }}>
                    🔋 Bateria: <span style={{ color: pos.battery > 20 ? '#00FF87' : '#FF4444' }}>{pos.battery}%</span>
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 10, color: '#7D8590', fontFamily: 'JetBrains Mono' }}>
                  {formatDistanceToNow(new Date(pos.recorded_at), { addSuffix: true })}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
