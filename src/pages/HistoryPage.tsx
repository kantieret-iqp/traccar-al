import { useState, useEffect } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { supabase, Position } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { Clock, Gauge, Route } from 'lucide-react'

export default function HistoryPage() {
  const { devices } = useDevices()
  const [selectedId, setSelectedId] = useState<string>('')
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (devices.length && !selectedId) setSelectedId(devices[0].id)
  }, [devices, selectedId])

  async function loadHistory() {
    if (!selectedId) return
    setLoading(true)
    const { data } = await supabase
      .from('positions')
      .select('*')
      .eq('device_id', selectedId)
      .gte('recorded_at', startOfDay(new Date(dateFrom)).toISOString())
      .lte('recorded_at', endOfDay(new Date(dateTo)).toISOString())
      .order('recorded_at', { ascending: true })
      .limit(500)
    setPositions(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (selectedId) loadHistory() }, [selectedId, dateFrom, dateTo])

  const speedData = positions.map(p => ({
    time: format(new Date(p.recorded_at), 'HH:mm'),
    speed: Math.round(p.speed),
    altitude: Math.round(p.altitude),
  }))

  const maxSpeed = positions.length ? Math.max(...positions.map(p => p.speed)) : 0
  const avgSpeed = positions.length ? positions.reduce((a, p) => a + p.speed, 0) / positions.length : 0
  const totalDist = positions.length > 1
    ? positions.slice(1).reduce((acc, p, i) => {
        const prev = positions[i]
        const R = 6371
        const dLat = (p.lat - prev.lat) * Math.PI / 180
        const dLng = (p.lng - prev.lng) * Math.PI / 180
        const a = Math.sin(dLat/2)**2 + Math.cos(prev.lat * Math.PI/180) * Math.cos(p.lat * Math.PI/180) * Math.sin(dLng/2)**2
        return acc + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      }, 0)
    : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#161B22] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono">
        <div className="text-[#7D8590] mb-1">{label}</div>
        <div className="text-[#00FF87]">{payload[0]?.value} km/h</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0D1117] p-6 overflow-y-auto">
      <h1 className="text-xl font-bold text-[#E6EDF3] mb-6">Historiku i Rrugëve</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          className="bg-[#161B22] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors">
          {devices.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-[#161B22] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] font-mono transition-colors" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-[#161B22] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] font-mono transition-colors" />
        <button onClick={loadHistory} disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] text-[#00FF87] text-sm font-semibold hover:bg-[rgba(0,255,135,0.2)] transition-all disabled:opacity-50">
          {loading ? 'Duke ngarkuar...' : 'Ngarko'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Route, label: 'Distanca Totale', val: `${totalDist.toFixed(1)} km`, color: '#00FF87' },
          { icon: Gauge, label: 'Shpejtësia Maks', val: `${Math.round(maxSpeed)} km/h`, color: '#FFB800' },
          { icon: Clock, label: 'Pozicione', val: positions.length.toString(), color: '#4DA6FF' },
        ].map(s => (
          <div key={s.label} className="bg-[#161B22] border border-white/[0.05] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs font-mono text-[#7D8590]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Speed chart */}
      {speedData.length > 0 ? (
        <div className="bg-[#161B22] border border-white/[0.05] rounded-xl p-5 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#E6EDF3]">Grafiku i Shpejtësisë</h2>
            <div className="text-xs font-mono text-[#7D8590]">Mesatare: {avgSpeed.toFixed(0)} km/h</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={speedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: '#7D8590', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#7D8590', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} unit=" km/h" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="speed" stroke="#00FF87" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#00FF87', stroke: '#0D1117', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#161B22] border border-white/[0.05] rounded-xl">
          <div className="text-center py-16">
            <Route size={32} className="text-[#7D8590] mx-auto mb-3" />
            <div className="text-sm text-[#7D8590] font-mono">{loading ? 'Duke ngarkuar...' : 'Nuk ka të dhëna për periudhën e zgjedhur'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
