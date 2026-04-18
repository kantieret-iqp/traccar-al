import { useState, useEffect } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { useAuth } from '@/hooks/useAuth'
import { supabase, Device, Profile } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Copy, Check, Clock, User, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import WatchersPanel from '@/components/devices/WatchersPanel'

const ICONS: Record<string, string[]> = {
  vehicle: ['🚗','🚐','🚛','🚕','🚙','🛻','🚑','🚒','🚌','🏍️'],
  person:  ['👤','👦','👧','👴','👵','🧑','👨','👩','🏃','🚶'],
  animal:  ['🐕','🐈','🐄','🐎','🐖','🐑','🦮','🐩','🐓','🐇'],
  asset:   ['📦','🎒','💼','🧳','📱','💻','🔑','⌚','🚲','⛵'],
}
const CATEGORY_LABELS: Record<string, string> = {
  vehicle: 'Automjet', person: 'Person', animal: 'Kafshë', asset: 'Pasuri'
}
const CAT_ICON: Record<string, string> = { vehicle: '🚗', person: '👤', animal: '🐕', asset: '📦' }
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
    category: (device?.category ?? 'vehicle') as Device['category'],
    owner_id: device?.owner_id ?? '',
  })
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').order('full_name').then(({ data }) => {
      if (data) setUsers(data)
    })
  }, [])

  function handleCategory(cat: Device['category']) {
    setForm(p => ({ ...p, category: cat, icon: ICONS[cat][0] }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Emri është i detyrueshëm')
    setLoading(true)
    await onSave({ ...form, owner_id: form.owner_id || null })
    setLoading(false)
    onClose()
  }

  const catLabel: Record<string, string> = {
    vehicle: '🚗 Automjet', person: '👤 Person', animal: '🐕 Kafshë', asset: '📦 Pasuri'
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-bold mb-5">{device ? 'Ndrysho Pajisjen' : 'Shto Pajisje të Re'}</h2>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Kategoria</label>
            <div className="grid grid-cols-4 gap-2">
              {(['vehicle','person','animal','asset'] as const).map(cat => (
                <button key={cat} type="button" onClick={() => handleCategory(cat)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all text-center ${form.category === cat ? 'bg-[rgba(0,255,135,0.15)] border border-[rgba(0,255,135,0.3)] text-[#00FF87]' : 'bg-[#0D1117] border border-white/[0.08] text-[#7D8590] hover:border-white/20'}`}>
                  {catLabel[cat]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Emri</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={form.category === 'animal' ? 'Rex, Mimi...' : form.category === 'person' ? 'Artan Kelmendi' : 'Furgon #01'}
              className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors" />
          </div>
          {(form.category === 'vehicle' || form.category === 'asset') && (
            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">{form.category === 'vehicle' ? 'Targa' : 'ID / Seria'}</label>
              <input value={form.plate} onChange={e => setForm(p => ({ ...p, plate: e.target.value }))}
                placeholder={form.category === 'vehicle' ? 'AA 001 BB' : 'SN-12345'}
                className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors" />
            </div>
          )}
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">
              {form.category === 'person' ? 'Personi (llogaria e tij)' : form.category === 'animal' ? 'Pronari i kafshës' : 'Pronari kryesor'}
            </label>
            <select value={form.owner_id} onChange={e => setForm(p => ({ ...p, owner_id: e.target.value }))}
              className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors">
              <option value="">— Pa pronar (vetëm admin e sheh) —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name ?? u.id.slice(0,8)} · {u.role}</option>
              ))}
            </select>
            <p className="text-[10px] font-mono text-[#7D8590] mt-1">
              Pronari kryesor + vëzhguesit shtesë mund të shtohen pas krijimit.
            </p>
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Ikona</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS[form.category].map(ic => (
                <button key={ic} type="button" onClick={() => setForm(p => ({ ...p, icon: ic }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === ic ? 'bg-[rgba(0,255,135,0.15)] border border-[rgba(0,255,135,0.3)]' : 'bg-[#0D1117] border border-white/[0.08] hover:border-white/20'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Ngjyra në hartë</label>
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

function OwnerCell({ ownerId }: { ownerId: string | null }) {
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    if (!ownerId) return
    supabase.from('profiles').select('full_name,role').eq('id', ownerId).single()
      .then(({ data }) => { if (data) setName(`${data.full_name ?? 'Pa emër'} · ${data.role}`) })
  }, [ownerId])
  if (!ownerId) return <span className="text-[10px] font-mono text-[#7D8590]">—</span>
  return (
    <div className="flex items-center gap-1.5">
      <User size={10} className="text-[#4DA6FF]" />
      <span className="text-[10px] font-mono text-[#4DA6FF]">{name ?? '...'}</span>
    </div>
  )
}

export default function DevicesPage() {
  const { devices, loading, addDevice, updateDevice, deleteDevice } = useDevices()
  const { isAdmin } = useAuth()
  const [modal, setModal] = useState<{ open: boolean; device: Device | null }>({ open: false, device: null })
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  const filtered = filterCat === 'all' ? devices : devices.filter(d => d.category === filterCat)
  const counts = {
    vehicle: devices.filter(d => d.category === 'vehicle').length,
    person:  devices.filter(d => d.category === 'person').length,
    animal:  devices.filter(d => d.category === 'animal').length,
    asset:   devices.filter(d => d.category === 'asset').length,
  }

  return (
    <div className="h-full flex flex-col bg-[#0D1117] p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#E6EDF3]">Pajisjet GPS</h1>
          <p className="text-sm text-[#7D8590] font-mono mt-0.5">{devices.length} pajisje gjithsej</p>
        </div>
        {isAdmin && (
          <button onClick={() => setModal({ open: true, device: null })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] text-[#00FF87] text-sm font-semibold hover:bg-[rgba(0,255,135,0.2)] transition-all">
            <Plus size={16} />Shto Pajisje
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { key: 'vehicle', label: 'Automjete', emoji: '🚗' },
          { key: 'person',  label: 'Persona',   emoji: '👤' },
          { key: 'animal',  label: 'Kafshë',    emoji: '🐕' },
          { key: 'asset',   label: 'Pasuri',    emoji: '📦' },
        ].map(c => (
          <button key={c.key} onClick={() => setFilterCat(filterCat === c.key ? 'all' : c.key)}
            className={`bg-[#161B22] border rounded-xl p-3 text-left transition-all ${filterCat === c.key ? 'border-[rgba(0,255,135,0.3)] bg-[rgba(0,255,135,0.05)]' : 'border-white/[0.05] hover:border-white/10'}`}>
            <div className="text-xl mb-1">{c.emoji}</div>
            <div className="text-lg font-bold text-[#E6EDF3]">{counts[c.key as keyof typeof counts]}</div>
            <div className="text-[10px] font-mono text-[#7D8590]">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Devices */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(dev => (
            <div key={dev.id} className="bg-[#161B22] border border-white/[0.05] rounded-xl overflow-hidden">
              {/* Main row */}
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${dev.color}15`, border: `1px solid ${dev.color}30` }}>
                  {dev.icon}
                </div>

                {/* Name + plate */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#E6EDF3]">{dev.name}</span>
                    <span className="text-[9px] font-mono text-[#7D8590]">
                      {CAT_ICON[dev.category ?? 'vehicle']} {CATEGORY_LABELS[dev.category ?? 'vehicle']}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[dev.status] }} />
                      <span className="text-[9px] font-mono" style={{ color: STATUS_COLOR[dev.status] }}>
                        {STATUS_LABEL[dev.status]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {dev.plate && <span className="text-[10px] font-mono text-[#7D8590]">{dev.plate}</span>}
                    <OwnerCell ownerId={dev.owner_id} />
                    {dev.last_seen && (
                      <span className="text-[9px] font-mono text-[#7D8590] flex items-center gap-1">
                        <Clock size={9} />
                        {formatDistanceToNow(new Date(dev.last_seen), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Token */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <code className="text-[9px] font-mono text-[#7D8590] bg-[#0D1117] px-2 py-1 rounded hidden md:block max-w-[100px] truncate">
                    {dev.identifier}
                  </code>
                  <button onClick={() => copyToken(dev.identifier)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#7D8590] hover:text-[#00FF87] transition-all">
                    {copied === dev.identifier ? <Check size={12} className="text-[#00FF87]" /> : <Copy size={12} />}
                  </button>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setModal({ open: true, device: dev })}
                      className="p-2 rounded-lg hover:bg-white/[0.05] text-[#7D8590] hover:text-[#E6EDF3] transition-all">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(dev.id)} disabled={deleting === dev.id}
                      className="p-2 rounded-lg hover:bg-[rgba(255,68,68,0.08)] text-[#7D8590] hover:text-[#FF4444] transition-all disabled:opacity-50">
                      {deleting === dev.id
                        ? <div className="w-3 h-3 border border-[#FF4444] border-t-transparent rounded-full animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                    {/* Toggle watchers panel */}
                    <button
                      onClick={() => setExpandedId(expandedId === dev.id ? null : dev.id)}
                      className={`p-2 rounded-lg transition-all ${expandedId === dev.id ? 'bg-[rgba(77,166,255,0.1)] text-[#4DA6FF]' : 'text-[#7D8590] hover:text-[#4DA6FF] hover:bg-[rgba(77,166,255,0.05)]'}`}
                      title="Menaxho vëzhguesit">
                      {expandedId === dev.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Watchers panel — expands below */}
              {isAdmin && expandedId === dev.id && (
                <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
                  <WatchersPanel device={dev} />
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-[#161B22] rounded-xl border border-white/[0.05]">
              <div className="text-3xl mb-3">📡</div>
              <div className="text-sm text-[#7D8590] font-mono">
                {filterCat === 'all' ? 'Nuk ka pajisje.' : `Nuk ka pajisje të kategorisë "${CATEGORY_LABELS[filterCat]}".`}
              </div>
            </div>
          )}
        </div>
      )}

      {modal.open && isAdmin && (
        <DeviceModal device={modal.device} onSave={handleSave} onClose={() => setModal({ open: false, device: null })} />
      )}
    </div>
  )
}
