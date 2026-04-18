import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { User, Server, Key, Shield, Save } from 'lucide-react'

export default function SettingsPage() {
  const { profile, user } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function saveProfile() {
    if (!user) return
    setLoading(true)
    await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  return (
    <div className="h-full flex flex-col bg-[#0D1117] p-6 overflow-y-auto">
      <h1 className="text-xl font-bold text-[#E6EDF3] mb-6">Cilësimet</h1>

      <div className="max-w-xl flex flex-col gap-5">
        {/* Profile */}
        <div className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <User size={16} className="text-[#00FF87]" />
            <h2 className="text-sm font-bold text-[#E6EDF3]">Profili</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Emri i plotë</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-[#0D1117] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Email</label>
              <input value={user?.email ?? ''} disabled
                className="w-full bg-[#0D1117] border border-white/[0.05] rounded-xl px-3 py-2.5 text-sm text-[#7D8590] font-mono opacity-60" />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Roli</label>
              <div className="inline-flex items-center gap-2 bg-[rgba(0,255,135,0.08)] border border-[rgba(0,255,135,0.2)] rounded-lg px-3 py-1.5 text-xs font-mono text-[#00FF87]">
                <Shield size={11} />
                {profile?.role === 'admin' ? 'Administrator' : profile?.role === 'driver' ? 'Shofer' : 'Vëzhgues'}
              </div>
            </div>
            <button onClick={saveProfile} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] text-[#00FF87] text-sm font-semibold hover:bg-[rgba(0,255,135,0.2)] transition-all disabled:opacity-50 w-fit">
              <Save size={14} />
              {loading ? 'Duke ruajtur...' : saved ? '✓ Ruajtur!' : 'Ruaj profilin'}
            </button>
          </div>
        </div>

        {/* Server info */}
        <div className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Server size={16} className="text-[#4DA6FF]" />
            <h2 className="text-sm font-bold text-[#E6EDF3]">Serveri Supabase</h2>
          </div>
          <div className="flex flex-col gap-3 font-mono text-sm">
            <div className="flex items-center justify-between bg-[#0D1117] rounded-xl px-3 py-2.5 border border-white/[0.04]">
              <span className="text-[#7D8590] text-xs">URL</span>
              <span className="text-[#4DA6FF] text-xs truncate max-w-xs">{supabaseUrl}</span>
            </div>
            <div className="flex items-center justify-between bg-[#0D1117] rounded-xl px-3 py-2.5 border border-white/[0.04]">
              <span className="text-[#7D8590] text-xs">Statusi</span>
              <span className="text-[#00FF87] text-xs flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] inline-block" />Lidhur</span>
            </div>
            <div className="flex items-center justify-between bg-[#0D1117] rounded-xl px-3 py-2.5 border border-white/[0.04]">
              <span className="text-[#7D8590] text-xs">Realtime</span>
              <span className="text-[#00FF87] text-xs flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] blink inline-block" />Aktiv</span>
            </div>
          </div>
        </div>

        {/* API Keys info */}
        <div className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Key size={16} className="text-[#FFB800]" />
            <h2 className="text-sm font-bold text-[#E6EDF3]">Integrim GPS Client</h2>
          </div>
          <p className="text-xs font-mono text-[#7D8590] mb-3 leading-relaxed">
            Çdo pajisje GPS dërgon lokacionin duke përdorur <code className="text-[#4DA6FF]">identifier</code> unik. Kopjoni token-in nga faqja e Pajisjeeve dhe vendoseni në GPS Client.
          </p>
          <div className="bg-[#0D1117] rounded-xl p-3 border border-white/[0.04] font-mono text-xs text-[#E6EDF3]">
            <div className="text-[#7D8590] mb-2"># Endpoint (Supabase RPC)</div>
            <div className="text-[#00FF87]">POST {supabaseUrl}/rest/v1/rpc/upsert_position</div>
            <div className="mt-2 text-[#7D8590]">Body:</div>
            <div className="text-[#4DA6FF] whitespace-pre">{`{
  "p_identifier": "device-token",
  "p_lat": 41.328,
  "p_lng": 19.818,
  "p_speed": 60,
  "p_course": 90
}`}</div>
          </div>
        </div>

        {/* Deployment */}
        <div className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-base">▲</span>
            <h2 className="text-sm font-bold text-[#E6EDF3]">Vercel Deployment</h2>
          </div>
          <div className="flex flex-col gap-2 text-xs font-mono text-[#7D8590]">
            <div className="flex items-center gap-2"><span className="text-[#00FF87]">✓</span> Framework: Vite + React</div>
            <div className="flex items-center gap-2"><span className="text-[#00FF87]">✓</span> Build command: <code className="text-[#4DA6FF]">npm run build</code></div>
            <div className="flex items-center gap-2"><span className="text-[#00FF87]">✓</span> Output directory: <code className="text-[#4DA6FF]">dist</code></div>
            <div className="flex items-center gap-2"><span className="text-[#FFB800]">!</span> Env vars: <code className="text-[#4DA6FF]">VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY</code></div>
          </div>
        </div>
      </div>
    </div>
  )
}
