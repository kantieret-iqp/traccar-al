import { useState } from 'react'
import { TileLayer, WMSTileLayer } from 'react-leaflet'
import { Layers } from 'lucide-react'

export interface MapLayer {
  id: string
  label: string
  icon: string
  type: 'tile' | 'wms'
  url: string
  attribution?: string
  maxZoom?: number
  subdomains?: string[]
  wmsLayers?: string
  wmsFormat?: string
}

export const DEFAULT_LAYERS: MapLayer[] = [
  {
    id: 'osm',
    label: 'OpenStreetMap',
    icon: '🗺️',
    type: 'tile',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap',
    maxZoom: 19,
    subdomains: ['a','b','c'],
  },
  {
    id: 'google-street',
    label: 'Google Street',
    icon: '🛣️',
    type: 'tile',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
    maxZoom: 20,
  },
  {
    id: 'google-satellite',
    label: 'Google Satelit',
    icon: '🛰️',
    type: 'tile',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
    maxZoom: 20,
  },
  {
    id: 'google-hybrid',
    label: 'Google Hybrid',
    icon: '🌍',
    type: 'tile',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
    maxZoom: 20,
  },
  {
    id: 'google-terrain',
    label: 'Google Terrain',
    icon: '⛰️',
    type: 'tile',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
    maxZoom: 20,
  },
  {
    id: 'carto-dark',
    label: 'CartoDB Dark',
    icon: '🌑',
    type: 'tile',
    url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    attribution: '© CartoDB',
    maxZoom: 20,
  },
  {
    id: 'carto-light',
    label: 'CartoDB Light',
    icon: '⬜',
    type: 'tile',
    url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution: '© CartoDB',
    maxZoom: 20,
  },
  {
    id: 'esri-satellite',
    label: 'ESRI Satelit',
    icon: '🌐',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    maxZoom: 19,
  },
  {
    id: 'esri-topo',
    label: 'ESRI Topografi',
    icon: '🏔️',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
    maxZoom: 19,
  },
  {
    id: 'stadia-smooth',
    label: 'Stadia Smooth',
    icon: '🎨',
    type: 'tile',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png',
    attribution: '© Stadia Maps',
    maxZoom: 20,
  },
]

export const WMS_PRESET_LAYERS: MapLayer[] = [
  {
    id: 'wms-nasa',
    label: 'NASA GIBS',
    icon: '🚀',
    type: 'wms',
    url: 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
    attribution: '© NASA GIBS',
    wmsLayers: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    wmsFormat: 'image/jpeg',
  },
]

interface ActiveLayerProps { layer: MapLayer }

export function ActiveTileLayer({ layer }: ActiveLayerProps) {
  if (layer.type === 'wms') {
    return (
      <WMSTileLayer
        url={layer.url}
        layers={layer.wmsLayers ?? ''}
        format={layer.wmsFormat ?? 'image/png'}
        transparent={true}
        attribution={layer.attribution}
      />
    )
  }
  // Tile layer — NO subdomains prop if not needed (avoids length error)
  if (layer.subdomains) {
    return (
      <TileLayer
        url={layer.url}
        attribution={layer.attribution}
        maxZoom={layer.maxZoom ?? 19}
        subdomains={layer.subdomains}
      />
    )
  }
  return (
    <TileLayer
      url={layer.url}
      attribution={layer.attribution}
      maxZoom={layer.maxZoom ?? 19}
    />
  )
}

interface Props {
  activeLayerId: string
  onLayerChange: (layer: MapLayer) => void
}

const TABS = [
  { key: 'standard', label: 'Standard' },
  { key: 'google',   label: 'Google' },
  { key: 'esri',     label: 'ESRI' },
  { key: 'wms',      label: 'WMS' },
] as const

type TabKey = typeof TABS[number]['key']

const GROUPED: Record<string, string[]> = {
  standard: ['osm','carto-dark','carto-light','stadia-smooth'],
  google:   ['google-street','google-satellite','google-hybrid','google-terrain'],
  esri:     ['esri-satellite','esri-topo'],
}

export default function MapLayerControl({ activeLayerId, onLayerChange }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabKey>('standard')
  const [showWmsForm, setShowWmsForm] = useState(false)
  const [wmsUrl, setWmsUrl] = useState('')
  const [wmsLayers, setWmsLayers] = useState('')

  const allLayers = [...DEFAULT_LAYERS, ...WMS_PRESET_LAYERS]
  const active = allLayers.find(l => l.id === activeLayerId) ?? DEFAULT_LAYERS[0]

  function layersForTab(): MapLayer[] {
    if (tab === 'wms') return WMS_PRESET_LAYERS
    return DEFAULT_LAYERS.filter(l => GROUPED[tab]?.includes(l.id))
  }

  function addCustomWms() {
    if (!wmsUrl || !wmsLayers) return
    const custom: MapLayer = {
      id: `wms-custom-${Date.now()}`,
      label: 'WMS Personalizuar',
      icon: '🗂️',
      type: 'wms',
      url: wmsUrl,
      wmsLayers,
      wmsFormat: 'image/png',
    }
    onLayerChange(custom)
    setShowWmsForm(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(p => !p)}
        title="Ndrysho hartën"
        style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'rgba(0,255,135,0.15)' : 'rgba(13,17,23,0.92)',
          border: open ? '1px solid rgba(0,255,135,0.3)' : '1px solid rgba(255,255,255,0.1)',
          color: open ? '#00FF87' : '#7D8590',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Layers size={16} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0, width: 260,
          background: 'rgba(13,17,23,0.97)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 9999,
        }}>
          {/* Header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#E6EDF3' }}>Harta bazë</div>
            <div style={{ fontSize: 10, color: '#7D8590', fontFamily: 'monospace', marginTop: 2 }}>
              {active.icon} {active.label}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  flex: 1, padding: '8px 4px', fontSize: 10, fontWeight: 600,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: tab === t.key ? '#00FF87' : '#7D8590',
                  borderBottom: tab === t.key ? '2px solid #00FF87' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Layers */}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: 6 }}>
            {layersForTab().map(layer => (
              <button key={layer.id}
                onClick={() => { onLayerChange(layer); setOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                  background: activeLayerId === layer.id ? 'rgba(0,255,135,0.1)' : 'transparent',
                  border: activeLayerId === layer.id ? '1px solid rgba(0,255,135,0.2)' : '1px solid transparent',
                  cursor: 'pointer', marginBottom: 3, transition: 'all 0.1s',
                }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{layer.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#E6EDF3', flex: 1 }}>{layer.label}</span>
                {activeLayerId === layer.id && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FF87', flexShrink: 0 }} />
                )}
              </button>
            ))}

            {/* WMS custom form */}
            {tab === 'wms' && (
              !showWmsForm ? (
                <button onClick={() => setShowWmsForm(true)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent',
                    color: '#7D8590', fontSize: 11, cursor: 'pointer', marginTop: 4,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  + Shto WMS personalizuar
                </button>
              ) : (
                <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#7D8590', fontFamily: 'monospace', marginBottom: 4 }}>URL e serverit WMS</div>
                    <input value={wmsUrl} onChange={e => setWmsUrl(e.target.value)}
                      placeholder="https://your-server.com/wms"
                      style={{ width: '100%', background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 8px', fontSize: 10, color: '#E6EDF3', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: '#7D8590', fontFamily: 'monospace', marginBottom: 4 }}>Layers</div>
                    <input value={wmsLayers} onChange={e => setWmsLayers(e.target.value)}
                      placeholder="layer_name"
                      style={{ width: '100%', background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 8px', fontSize: 10, color: '#E6EDF3', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShowWmsForm(false)}
                      style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#7D8590', fontSize: 10, cursor: 'pointer' }}>
                      Anulo
                    </button>
                    <button onClick={addCustomWms}
                      style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid rgba(0,255,135,0.25)', background: 'rgba(0,255,135,0.1)', color: '#00FF87', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                      Shto
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  )
}
