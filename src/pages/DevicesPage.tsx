import { useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { Device } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Copy, Check, Wifi, WifiOff, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const ICONS = ['🚗','🚐','🚛','🏍️','🚌','🚑','🚒','🚕','🚙','🛻']
const COLORS = ['#00FF87','#4DA6FF','#FFB800','#FF6B6B','#C084FC','#F472B6','#34D399','#FB923C']
const STATUS_COLOR: Record<string, string> = { online: '#00FF87', idle: '#FFB800', offline: '#7D8590' }
const STATUS_LABEL: Record<string, string> = { online: 'Aktiv', idle: 'Ndalet', offline: 'Offline' }

function DeviceModal({ device, onSave, onClose }: {
  device?: Device | null
  onSave: (data: Partial<Device>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: device?.name ?? '',
    plate: device?.plate ?? '',
    icon: device?.icon ?? '🚗',
    color: device?.color ?? '#00FF87',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Emri është i detyrueshëm')
    setLoading(true)
    await onSave(form)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-bold mb-5">{device ? 'Ndrysho Pajisjen' : 'Shto Pajisje të Re'}</h2>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Emri</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Furgon #01"
              className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Targa (opsionale)</label>
            <input value={form.plate} onChange={e => setForm(p => ({ ...p, plate: e.target.value }))}
              placeholder="AA 001 BB"
              className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Ikona</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(p => ({ ...p, icon: ic }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === ic ? 'bg-[rgba(0,255,135,0.15)] border border-[rgba(0,255,135,0.3)]' : 'bg-[#0D1117] border border-white/[0.08] hover:border-white/20'}`}>
                  {ic}
                </button>
              ))}
            </div>
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
          {error && <div className="text-xs text-[#FF4444] font-mono bg-[rgba(255,68,68,0.1)] rounded-lg px-3 py-2">{error}</div>}
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-[#7D8590] hover:text-[#E6EDF3] transition-colors">
              Anulo
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] text-[#00FF87] text-sm font-semibold hover:bg-[rgba(0,255,135,0.2)] transition-all disabled:opacity-50">
              {loading ? 'Duke ruajtur...' : device ? 'Ruaj ndryshimet' : 'Shto pajisjen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DevicesPage() {
  const { devices, loading, addDevice, updateDevice, deleteDevice } = useDevices()
  const [modal, setModal] = useState<{ open: boolean; device: Device | null }>({ open: false, device: null })
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function copyToken(identifier: string) {
    navigator.clipboard.writeText(identifier)
    setCopied(identifier)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Jeni i sigurt? Kjo do fshijë të gjitha pozicionet e pajisjes.')) return
    setDeleting(id)
    await deleteDevice(id)
    setDeleting(null)
  }

  async function handleSave(data: Partial<Device>) {
    if (modal.device) await updateDevice(modal.device.id, data)
    else await addDevice(data)
  }

  return (
    <div className="h-full flex flex-col bg-[#0D1117] p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#E6EDF3]">Pajisjet GPS</h1>
          <p className="text-sm text-[#7D8590] font-mono mt-0.5">{devices.length} pajisje gjithsej</p>
        </div>
        <button onClick={() => setModal({ open: true, device: null })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] text-[#00FF87] text-sm font-semibold hover:bg-[rgba(0,255,135,0.2)] transition-all">
          <Plus size={16} />
          Shto Pajisje
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Online', val: devices.filter(d=>d.status==='online').length, color: '#00FF87' },
          { label: 'Ndalet', val: devices.filter(d=>d.status==='idle').length, color: '#FFB800' },
          { label: 'Offline', val: devices.filter(d=>d.status==='offline').length, color: '#7D8590' },
        ].map(s => (
          <div key={s.label} className="bg-[#161B22] border border-white/[0.05] rounded-xl p-4">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs font-mono text-[#7D8590] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Devices table */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#161B22] border border-white/[0.05] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Pajisja','Targa','Statusi','Token ID','Shikuar herën e fundit','Veprime'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono text-[#7D8590] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map(dev => (
                <tr key={dev.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${dev.color}15`, border: `1px solid ${dev.color}30` }}>
                        {dev.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#E6EDF3]">{dev.name}</div>
                        <div className="text-[10px] font-mono text-[#7D8590]">{dev.id.slice(0,8)}…</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-[#E6EDF3]">{dev.plate ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[dev.status] }} />
                      <span className="text-xs font-mono" style={{ color: STATUS_COLOR[dev.status] }}>{STATUS_LABEL[dev.status]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-[#7D8590] bg-[#0D1117] px-2 py-1 rounded truncate max-w-[120px]">
                        {dev.identifier}
                      </code>
                      <button onClick={() => copyToken(dev.identifier)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#7D8590] hover:text-[#00FF87] transition-all">
                        {copied === dev.identifier ? <Check size={12} className="text-[#00FF87]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7D8590]">
                      <Clock size={10} />
                      {dev.last_seen ? formatDistanceToNow(new Date(dev.last_seen), { addSuffix: true }) : 'Kurrë'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal({ open: true, device: dev })}
                        className="p-2 rounded-lg hover:bg-white/[0.05] text-[#7D8590] hover:text-[#E6EDF3] transition-all">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(dev.id)} disabled={deleting === dev.id}
                        className="p-2 rounded-lg hover:bg-[rgba(255,68,68,0.08)] text-[#7D8590] hover:text-[#FF4444] transition-all disabled:opacity-50">
                        {deleting === dev.id ? <div className="w-3 h-3 border border-[#FF4444] border-t-transparent rounded-full animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="text-3xl mb-3">📡</div>
                    <div className="text-sm text-[#7D8590] font-mono">Nuk ka pajisje. Shto të parën!</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <DeviceModal
          device={modal.device}
          onSave={handleSave}
          onClose={() => setModal({ open: false, device: null })}
        />
      )}
    </div>
  )
}
