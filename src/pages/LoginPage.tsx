import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Navigation, Eye, EyeOff } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'driver'>('driver')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    } else {
      const { error } = await signUp(email, password, fullName, role)
      if (error) setError(error)
      else setSuccess('Llogaria u krijua! Kontrolloni email-in tuaj për verifikim.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#00FF87 1px, transparent 1px), linear-gradient(90deg, #00FF87 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative w-full max-w-sm fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] flex items-center justify-center">
            <Navigation size={18} className="text-[#00FF87]" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-[#E6EDF3]">TrackAR Manager</h1>
            <p className="text-[11px] font-mono text-[#7D8590]">GPS Tracking Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[#0D1117] rounded-xl p-1">
            {(['signin', 'signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? 'bg-[rgba(0,255,135,0.12)] text-[#00FF87] border border-[rgba(0,255,135,0.2)]' : 'text-[#7D8590] hover:text-[#E6EDF3]'
                }`}>
                {m === 'signin' ? 'Hyr' : 'Regjistrohu'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Emri i plotë</label>
                  <input
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Artan Kelmendi" required
                    className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Roli</label>
                  <select value={role} onChange={e => setRole(e.target.value as any)}
                    className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors">
                    <option value="admin">Admin (menaxhon të gjitha)</option>
                    <option value="driver">Shofer (GPS client)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Fjalëkalimi</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full bg-[#0D1117] border border-white/[0.08] rounded-lg px-3 py-2.5 pr-10 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8590] hover:text-[#E6EDF3]">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[rgba(255,68,68,0.1)] border border-[rgba(255,68,68,0.2)] rounded-lg px-3 py-2.5 text-xs text-[#FF4444] font-mono">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-[rgba(0,255,135,0.08)] border border-[rgba(0,255,135,0.2)] rounded-lg px-3 py-2.5 text-xs text-[#00FF87] font-mono">
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] text-[#00FF87] font-semibold text-sm hover:bg-[rgba(0,255,135,0.2)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin" />Duke procesuar...</>
                : mode === 'signin' ? 'Hyr në sistem' : 'Krijo llogari'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#7D8590] font-mono mt-4">
          Powered by Supabase + Vercel
        </p>
      </div>
    </div>
  )
}
