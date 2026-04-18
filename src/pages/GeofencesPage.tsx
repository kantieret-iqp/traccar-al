import { useState } from 'react'
import { useGeofences } from '@/hooks/useGeofences'
import { Geofence } from '@/lib/supabase'
import { Plus, Trash2, ToggleLeft, ToggleRight, Shield } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const COLORS = ['#4DA6FF','#00FF87','#FFB800','#FF6B6B','#C084FC','#F472B6']

function GeoModal({ onSave, onClose }: { onSave: (d: Partial<Geofence>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', type: 'circle' as 'circle' | 'polygon', center_lat: 41.328, center_lng: 19.818, radius: 500, color: '#4DA6FF' })
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSave(form)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-bold mb-5">Shto Zonë Gjeografike</h2>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Emri</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Depoja Qendrore" required
              className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Latitude</label>
              <input type="number" step="any" value={form.center_lat} onChange={e => setForm(p => ({ ...p, center_lat: parseFloat(e.target.value) }))}
                className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] font-mono transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Longitude</label>
              <input type="number" step="any" value={form.center_lng} onChange={e => setForm(p => ({ ...p, center_lng: parseFloat(e.target.value) }))}
                className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] font-mono transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Rrezja (metra)</label>
            <input type="number" value={form.radius} onChange={e => setForm(p => ({ ...p, radius: parseInt(e.target.value) }))}
              min={50} max={50000}
              className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] font-mono transition-colors" />
            <input type="range" min={50} max={10000} value={form.radius} onChange={e => setForm(p => ({ ...p, radius: parseInt(e.target.value) }))}
              className="w-full mt-2 accent-[#00FF87]" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Ngjyra</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161B22]' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-[#7D8590] hover:text-[#E6EDF3] transition-colors">Anulo</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] text-[#00FF87] text-sm font-semibold hover:bg-[rgba(0,255,135,0.2)] transition-all disabled:opacity-50">
              {loading ? 'Duke ruajtur...' : 'Shto zonën'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GeofencesPage() {
  const { geofences, loading, addGeofence, toggleGeofence, deleteGeofence } = useGeofences()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="h-full flex flex-col bg-[#0D1117] p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#E6EDF3]">Zonat Gjeografike</h1>
          <p className="text-sm text-[#7D8590] font-mono mt-0.5">{geofences.filter(g => g.active).length} aktive nga {geofences.length}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] text-[#00FF87] text-sm font-semibold hover:bg-[rgba(0,255,135,0.2)] transition-all">
          <Plus size={16} />Shto Zonë
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {geofences.map(geo => (
            <div key={geo.id} className={`bg-[#161B22] border rounded-xl p-4 transition-all ${geo.active ? 'border-white/[0.08]' : 'border-white/[0.04] opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${geo.color}15`, border: `1px solid ${geo.color}30` }}>
                    <Shield size={18} style={{ color: geo.color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#E6EDF3]">{geo.name}</div>
                    <div className="text-[10px] font-mono text-[#7D8590]">{geo.type === 'circle' ? `Rreth · ${geo.radius}m` : 'Poligon'}</div>
                  </div>
                </div>
                <button onClick={() => toggleGeofence(geo.id, !geo.active)} className="text-[#7D8590] hover:text-[#E6EDF3] transition-colors">
                  {geo.active ? <ToggleRight size={20} style={{ color: geo.color }} /> : <ToggleLeft size={20} />}
                </button>
              </div>

              {geo.type === 'circle' && geo.center_lat && (
                <div className="font-mono text-[10px] text-[#7D8590] bg-[#0D1117] rounded-lg px-3 py-2 mb-3">
                  {geo.center_lat.toFixed(4)}° N, {geo.center_lng?.toFixed(4)}° E
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono text-[#7D8590]">
                  {formatDistanceToNow(new Date(geo.created_at), { addSuffix: true })}
                </div>
                <button onClick={() => deleteGeofence(geo.id)}
                  className="p-1.5 rounded-lg hover:bg-[rgba(255,68,68,0.08)] text-[#7D8590] hover:text-[#FF4444] transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {geofences.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <Shield size={32} className="text-[#7D8590] mx-auto mb-3" />
              <div className="text-sm text-[#7D8590] font-mono">Nuk ka zona. Shto të parën!</div>
            </div>
          )}
        </div>
      )}
      {showModal && <GeoModal onSave={addGeofence} onClose={() => setShowModal(false)} />}
    </div>
  )
}
