import { useState } from 'react'
import { useWatchers } from '@/hooks/useWatchers'
import { Device } from '@/lib/supabase'
import { UserPlus, Trash2, Eye, EyeOff, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Props { device: Device }

const ROLE_COLORS: Record<string, string> = {
  admin:  'text-[#00FF87] bg-[rgba(0,255,135,0.08)] border-[rgba(0,255,135,0.2)]',
  driver: 'text-[#4DA6FF] bg-[rgba(77,166,255,0.08)] border-[rgba(77,166,255,0.2)]',
  viewer: 'text-[#FFB800] bg-[rgba(255,184,0,0.08)] border-[rgba(255,184,0,0.2)]',
}

export default function WatchersPanel({ device }: Props) {
  const { watchers, allUsers, loading, addWatcher, removeWatcher, toggleHistory } = useWatchers(device.id)
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [withHistory, setWithHistory] = useState(true)
  const [adding, setAdding] = useState(false)

  const watcherIds = watchers.map(w => w.user_id)
  const available = allUsers.filter(u => u.id !== device.owner_id && !watcherIds.includes(u.id))

  async function handleAdd() {
    if (!selectedUser) return
    setAdding(true)
    await addWatcher(selectedUser, withHistory)
    setSelectedUser('')
    setAdding(false)
  }

  return (
    <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[#4DA6FF]" />
          <span className="text-xs font-semibold text-[#E6EDF3]">Vëzhguesit ({watchers.length})</span>
          {watchers.length > 0 && (
            <div className="flex -space-x-1">
              {watchers.slice(0, 3).map(w => (
                <div key={w.user_id} className="w-5 h-5 rounded-full bg-[rgba(77,166,255,0.2)] border border-[#0D1117] flex items-center justify-center text-[8px] font-bold text-[#4DA6FF]">
                  {w.profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
                </div>
              ))}
              {watchers.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-white/[0.08] border border-[#0D1117] flex items-center justify-center text-[8px] text-[#7D8590]">
                  +{watchers.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-[#7D8590]" /> : <ChevronDown size={14} className="text-[#7D8590]" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/[0.06]">
          {/* Add watcher */}
          <div className="pt-3 mb-4">
            <div className="text-[9px] font-mono text-[#7D8590] uppercase tracking-wider mb-2">Shto vëzhgues</div>
            <div className="flex gap-2 items-center">
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                className="flex-1 bg-[#161B22] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#E6EDF3] outline-none focus:border-[rgba(77,166,255,0.3)] transition-colors">
                <option value="">— Zgjidh user-in —</option>
                {available.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name ?? u.id.slice(0, 8)} · {u.role}
                  </option>
                ))}
              </select>
              <button onClick={() => setWithHistory(p => !p)}
                title={withHistory ? 'Historiku: PO' : 'Historiku: JO'}
                className={`p-2 rounded-lg border transition-all flex-shrink-0 ${withHistory ? 'bg-[rgba(0,255,135,0.08)] border-[rgba(0,255,135,0.2)] text-[#00FF87]' : 'bg-[#161B22] border-white/[0.08] text-[#7D8590]'}`}>
                {withHistory ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button onClick={handleAdd} disabled={!selectedUser || adding}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(77,166,255,0.1)] border border-[rgba(77,166,255,0.2)] text-[#4DA6FF] text-xs font-semibold hover:bg-[rgba(77,166,255,0.15)] transition-all disabled:opacity-40 flex-shrink-0">
                <UserPlus size={13} />
                {adding ? '...' : 'Shto'}
              </button>
            </div>
            <p className="text-[9px] font-mono text-[#7D8590] mt-1.5">
              Ikona syri = lejon vëzhguesin të shohë historikun e rrugëve
            </p>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-[#4DA6FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : watchers.length === 0 ? (
            <div className="text-center py-4 text-[11px] font-mono text-[#7D8590]">
              Asnjë vëzhgues. Shto user-a që mund të ndjekin këtë pajisje.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {watchers.map(w => (
                <div key={w.user_id} className="flex items-center gap-3 bg-[#161B22] border border-white/[0.05] rounded-lg px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-[rgba(77,166,255,0.15)] border border-[rgba(77,166,255,0.2)] flex items-center justify-center text-[11px] font-bold text-[#4DA6FF] flex-shrink-0">
                    {w.profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#E6EDF3] truncate">
                        {w.profile?.full_name ?? w.user_id.slice(0, 8)}
                      </span>
                      {w.profile?.role && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${ROLE_COLORS[w.profile.role] ?? ''}`}>
                          {w.profile.role}
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] font-mono text-[#7D8590] mt-0.5">
                      Shtuar {formatDistanceToNow(new Date(w.added_at), { addSuffix: true })}
                    </div>
                  </div>
                  <button onClick={() => toggleHistory(w.user_id, !w.can_see_history)}
                    title={w.can_see_history ? 'Sheh historikun' : 'Nuk sheh historikun'}
                    className={`p-1.5 rounded-lg border transition-all flex-shrink-0 ${w.can_see_history ? 'bg-[rgba(0,255,135,0.08)] border-[rgba(0,255,135,0.2)] text-[#00FF87]' : 'bg-[#0D1117] border-white/[0.06] text-[#7D8590]'}`}>
                    {w.can_see_history ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button onClick={() => removeWatcher(w.user_id)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(255,68,68,0.08)] text-[#7D8590] hover:text-[#FF4444] transition-all flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
