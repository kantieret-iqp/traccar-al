import { useState } from 'react'
import { useMap, TileLayer, WMSTileLayer } from 'react-leaflet'
import { Layers } from 'lucide-react'

export interface MapLayer {
  id: string
  label: string
  icon: string
  type: 'tile' | 'wms' | 'google'
  url: string
  options?: Record<string, unknown>
  wmsOptions?: {
    layers: string
    format: string
    transparent?: boolean
    version?: string
    attribution?: string
  }
}

export const DEFAULT_LAYERS: MapLayer[] = [
  {
    id: 'osm',
    label: 'OpenStreetMap',
    icon: '🗺️',
    type: 'tile',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { attribution: '© OpenStreetMap contributors', maxZoom: 19 }
  },
  {
    id: 'google-street',
    label: 'Google Street',
    icon: '🛣️',
    type: 'tile',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    options: { attribution: '© Google Maps', subdomains: '0123', maxZoom: 20 }
  },
  {
    id: 'google-satellite',
    label: 'Google Satelit',
    icon: '🛰️',
    type: 'tile',
    url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    options: { attribution: '© Google Maps', subdomains: '0123', maxZoom: 20 }
  },
  {
    id: 'google-hybrid',
    label: 'Google Hybrid',
    icon: '🌍',
    type: 'tile',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    options: { attribution: '© Google Maps', subdomains: '0123', maxZoom: 20 }
  },
  {
    id: 'google-terrain',
    label: 'Google Terrain',
    icon: '⛰️',
    type: 'tile',
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    options: { attribution: '© Google Maps', subdomains: '0123', maxZoom: 20 }
  },
  {
    id: 'carto-dark',
    label: 'CartoDB Dark',
    icon: '🌑',
    type: 'tile',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: { attribution: '© CartoDB', subdomains: 'abcd', maxZoom: 20 }
  },
  {
    id: 'carto-light',
    label: 'CartoDB Light',
    icon: '⬜',
    type: 'tile',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    options: { attribution: '© CartoDB', subdomains: 'abcd', maxZoom: 20 }
  },
  {
    id: 'esri-satellite',
    label: 'ESRI Satelit',
    icon: '🌐',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: { attribution: '© Esri', maxZoom: 19 }
  },
  {
    id: 'esri-topo',
    label: 'ESRI Topografi',
    icon: '🏔️',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: { attribution: '© Esri', maxZoom: 19 }
  },
  {
    id: 'stadia-smooth',
    label: 'Stadia Smooth',
    icon: '🎨',
    type: 'tile',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    options: { attribution: '© Stadia Maps', maxZoom: 20 }
  },
]

// WMS example layers
export const WMS_LAYERS: MapLayer[] = [
  {
    id: 'wms-nasa',
    label: 'NASA GIBS',
    icon: '🚀',
    type: 'wms',
    url: 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
    wmsOptions: {
      layers: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      format: 'image/jpeg',
      transparent: false,
      attribution: '© NASA GIBS',
    }
  },
]

interface ActiveLayerProps {
  layer: MapLayer
}

export function ActiveTileLayer({ layer }: ActiveLayerProps) {
  if (layer.type === 'wms' && layer.wmsOptions) {
    return (
      <WMSTileLayer
        url={layer.url}
        layers={layer.wmsOptions.layers}
        format={layer.wmsOptions.format}
        transparent={layer.wmsOptions.transparent ?? false}
        version={layer.wmsOptions.version ?? '1.1.1'}
        attribution={layer.wmsOptions.attribution}
      />
    )
  }
  return (
    <TileLayer
      url={layer.url}
      attribution={layer.options?.attribution as string}
      maxZoom={layer.options?.maxZoom as number}
      subdomains={layer.options?.subdomains as string}
    />
  )
}

interface Props {
  activeLayerId: string
  onLayerChange: (layer: MapLayer) => void
  customWmsUrl?: string
}

export default function MapLayerControl({ activeLayerId, onLayerChange, customWmsUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [showWmsForm, setShowWmsForm] = useState(false)
  const [wmsUrl, setWmsUrl] = useState(customWmsUrl ?? '')
  const [wmsLayers, setWmsLayers] = useState('')
  const [tab, setTab] = useState<'standard' | 'google' | 'esri' | 'wms'>('standard')

  const allLayers = [...DEFAULT_LAYERS, ...WMS_LAYERS]
  const activeLayer = allLayers.find(l => l.id === activeLayerId) ?? DEFAULT_LAYERS[0]

  const grouped = {
    standard: DEFAULT_LAYERS.filter(l => ['osm','carto-dark','carto-light','stadia-smooth'].includes(l.id)),
    google:   DEFAULT_LAYERS.filter(l => l.id.startsWith('google')),
    esri:     DEFAULT_LAYERS.filter(l => l.id.startsWith('esri')),
    wms:      WMS_LAYERS,
  }

  function addCustomWms() {
    if (!wmsUrl || !wmsLayers) return
    const custom: MapLayer = {
      id: `wms-custom-${Date.now()}`,
      label: 'WMS Personalizuar',
      icon: '🗂️',
      type: 'wms',
      url: wmsUrl,
      wmsOptions: { layers: wmsLayers, format: 'image/png', transparent: true }
    }
    onLayerChange(custom)
    setShowWmsForm(false)
    setOpen(false)
  }

  const tabs = [
    { key: 'standard', label: 'Standard' },
    { key: 'google',   label: 'Google' },
    { key: 'esri',     label: 'ESRI' },
    { key: 'wms',      label: 'WMS' },
  ] as const

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(p => !p)}
        title="Ndrysho hartën"
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm ${
          open
            ? 'bg-[rgba(0,255,135,0.15)] border border-[rgba(0,255,135,0.3)] text-[#00FF87]'
            : 'bg-[rgba(13,17,23,0.9)] border border-white/[0.08] text-[#7D8590] hover:text-[#00FF87] hover:border-[rgba(0,255,135,0.2)]'
        }`}
      >
        <Layers size={16} />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-11 w-72 bg-[rgba(13,17,23,0.97)] border border-white/[0.08] rounded-xl overflow-hidden z-[1001] backdrop-blur-md shadow-xl"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="text-xs font-bold text-[#E6EDF3]">Harta bazë</div>
            <div className="text-[10px] font-mono text-[#7D8590] mt-0.5">
              Aktive: {activeLayer.icon} {activeLayer.label}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2 text-[10px] font-semibold transition-all ${
                  tab === t.key
                    ? 'text-[#00FF87] border-b-2 border-[#00FF87]'
                    : 'text-[#7D8590] hover:text-[#E6EDF3]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Layer list */}
          <div className="max-h-56 overflow-y-auto p-2">
            {tab !== 'wms' ? (
              grouped[tab].map(layer => (
                <button key={layer.id}
                  onClick={() => { onLayerChange(layer); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-1 ${
                    activeLayerId === layer.id
                      ? 'bg-[rgba(0,255,135,0.1)] border border-[rgba(0,255,135,0.2)]'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}>
                  <span className="text-lg flex-shrink-0">{layer.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-[#E6EDF3]">{layer.label}</div>
                  </div>
                  {activeLayerId === layer.id && (
                    <div className="w-2 h-2 rounded-full bg-[#00FF87] flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-1">
                {/* Predefined WMS */}
                {WMS_LAYERS.map(layer => (
                  <button key={layer.id}
                    onClick={() => { onLayerChange(layer); setOpen(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-1 ${
                      activeLayerId === layer.id
                        ? 'bg-[rgba(0,255,135,0.1)] border border-[rgba(0,255,135,0.2)]'
                        : 'hover:bg-white/[0.04] border border-transparent'
                    }`}>
                    <span className="text-lg">{layer.icon}</span>
                    <div className="text-xs font-semibold text-[#E6EDF3]">{layer.label}</div>
                    {activeLayerId === layer.id && <div className="w-2 h-2 rounded-full bg-[#00FF87] ml-auto" />}
                  </button>
                ))}

                {/* Custom WMS form */}
                {!showWmsForm ? (
                  <button onClick={() => setShowWmsForm(true)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] border border-dashed border-white/[0.1] text-[#7D8590] hover:text-[#E6EDF3] text-xs transition-all mt-1">
                    <span>+</span>
                    Shto WMS personalizuar
                  </button>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    <div>
                      <div className="text-[9px] font-mono text-[#7D8590] mb-1">URL e serverit WMS</div>
                      <input
                        value={wmsUrl}
                        onChange={e => setWmsUrl(e.target.value)}
                        placeholder="https://your-server.com/wms"
                        className="w-full bg-[#161B22] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors"
                      />
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-[#7D8590] mb-1">Layers (p.sh. 0,1,2)</div>
                      <input
                        value={wmsLayers}
                        onChange={e => setWmsLayers(e.target.value)}
                        placeholder="layer_name"
                        className="w-full bg-[#161B22] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowWmsForm(false)}
                        className="flex-1 py-1.5 rounded-lg border border-white/[0.08] text-[10px] text-[#7D8590] hover:text-[#E6EDF3] transition-colors">
                        Anulo
                      </button>
                      <button onClick={addCustomWms}
                        className="flex-1 py-1.5 rounded-lg bg-[rgba(0,255,135,0.1)] border border-[rgba(0,255,135,0.2)] text-[10px] text-[#00FF87] font-semibold hover:bg-[rgba(0,255,135,0.15)] transition-colors">
                        Shto
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
