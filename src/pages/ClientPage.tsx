import { useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { useGPSClient } from '@/hooks/useGPSClient'
import { Radio, Play, Square, Battery, Signal, MapPin, Clock, Gauge, Navigation2 } from 'lucide-react'
import { format } from 'date-fns'

const COURSE_DIRS = ['N','NE','E','SE','S','SW','W','NW']

export default function ClientPage() {
  const { devices } = useDevices()
  const [selectedIdentifier, setSelectedIdentifier] = useState('')
  const [interval, setIntervalSec] = useState(30)
  const [highAccuracy, setHighAccuracy] = useState(true)

  const client = useGPSClient({
    deviceIdentifier: selectedIdentifier,
    intervalSeconds: interval,
    highAccuracy,
  })

  const pos = client.position?.coords
  const courseDir = pos?.heading != null ? COURSE_DIRS[Math.round(pos.heading / 45) % 8] : '—'

  return (
    <div className="h-full flex flex-col bg-[#0D1117] p-6 overflow-y-auto">
      <div className="max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] flex items-center justify-center">
            <Radio size={18} className="text-[#00FF87]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#E6EDF3]">GPS Client</h1>
            <p className="text-xs font-mono text-[#7D8590]">Dërgo lokacionin nga ky pajisje</p>
          </div>
        </div>

        {/* Status card */}
        <div className={`border rounded-2xl p-5 mb-5 transition-all ${
          client.running
            ? 'bg-[rgba(0,255,135,0.05)] border-[rgba(0,255,135,0.2)]'
            : 'bg-[#161B22] border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-2.5 h-2.5 rounded-full ${client.running ? 'bg-[#00FF87] blink' : 'bg-[#7D8590]'}`} />
            <span className="font-mono text-sm font-bold" style={{ color: client.running ? '#00FF87' : '#7D8590' }}>
              {client.running ? 'DUKE TRANSMETUAR' : 'NDALUR'}
            </span>
            {client.running && (
              <span className="ml-auto text-xs font-mono text-[#7D8590]">
                {client.positionsCount} dërgime
              </span>
            )}
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0D1117] rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-1.5 mb-2">
                <Gauge size={12} className="text-[#7D8590]" />
                <span className="text-[9px] font-mono text-[#7D8590] uppercase tracking-wider">Shpejtësia</span>
              </div>
              <div className="text-xl font-bold text-[#00FF87] font-mono">
                {pos?.speed != null ? Math.round(pos.speed * 3.6) : 0}
                <span className="text-xs text-[#7D8590] ml-1">km/h</span>
              </div>
            </div>

            <div className="bg-[#0D1117] rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-1.5 mb-2">
                <Navigation2 size={12} className="text-[#7D8590]" />
                <span className="text-[9px] font-mono text-[#7D8590] uppercase tracking-wider">Drejtimi</span>
              </div>
              <div className="text-xl font-bold text-[#E6EDF3] font-mono">{courseDir}</div>
            </div>

            <div className="bg-[#0D1117] rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin size={12} className="text-[#7D8590]" />
                <span className="text-[9px] font-mono text-[#7D8590] uppercase tracking-wider">Saktësia</span>
              </div>
              <div className="text-xl font-bold text-[#FFB800] font-mono">
                {pos?.accuracy != null ? `±${Math.round(pos.accuracy)}` : '—'}
                <span className="text-xs text-[#7D8590] ml-1">m</span>
              </div>
            </div>

            <div className="bg-[#0D1117] rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-1.5 mb-2">
                <Battery size={12} className="text-[#7D8590]" />
                <span className="text-[9px] font-mono text-[#7D8590] uppercase tracking-wider">Bateria</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: client.battery && client.battery < 20 ? '#FF4444' : '#E6EDF3' }}>
                {client.battery != null ? `${client.battery}%` : '—'}
              </div>
            </div>
          </div>

          {pos && (
            <div className="mt-3 font-mono text-[11px] text-[#7D8590] bg-[#0D1117] rounded-xl px-3 py-2.5 border border-white/[0.04]">
              <div>{pos.latitude.toFixed(6)}° N, {pos.longitude.toFixed(6)}° E</div>
              {pos.altitude != null && <div className="mt-0.5">Lartësia: {Math.round(pos.altitude)} m</div>}
            </div>
          )}

          {client.lastSent && (
            <div className="flex items-center gap-1.5 mt-3 text-[10px] font-mono text-[#7D8590]">
              <Clock size={10} />
              Dërguar: {format(client.lastSent, 'HH:mm:ss')}
            </div>
          )}

          {client.error && (
            <div className="mt-3 bg-[rgba(255,68,68,0.1)] border border-[rgba(255,68,68,0.2)] rounded-xl px-3 py-2.5 text-xs text-[#FF4444] font-mono">
              ⚠️ {client.error}
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-bold text-[#E6EDF3] mb-4">Konfigurimi</h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">Pajisja</label>
              <select
                value={selectedIdentifier}
                onChange={e => setSelectedIdentifier(e.target.value)}
                disabled={client.running}
                className="w-full bg-[#0D1117] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#E6EDF3] outline-none focus:border-[rgba(0,255,135,0.3)] transition-colors disabled:opacity-50"
              >
                <option value="">— Zgjidh pajisjen —</option>
                {devices.map(d => (
                  <option key={d.id} value={d.identifier}>{d.icon} {d.name} ({d.plate ?? d.identifier.slice(0, 12)}…)</option>
                ))}
              </select>
              {selectedIdentifier && (
                <div className="mt-1.5 text-[10px] font-mono text-[#7D8590]">
                  Token: <code className="text-[#4DA6FF]">{selectedIdentifier}</code>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-[#7D8590] mb-1.5">
                Intervali i dërgimit: <span className="text-[#00FF87]">{interval}s</span>
              </label>
              <input
                type="range" min={5} max={300} value={interval}
                onChange={e => setIntervalSec(Number(e.target.value))}
                disabled={client.running}
                className="w-full accent-[#00FF87] disabled:opacity-50"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#7D8590] mt-1">
                <span>5s (shumë shpesh)</span>
                <span>5min (kursim)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#E6EDF3]">Saktësi e Lartë GPS</div>
                <div className="text-xs font-mono text-[#7D8590]">Konsumon më shumë bateri</div>
              </div>
              <button
                onClick={() => setHighAccuracy(p => !p)}
                disabled={client.running}
                className={`relative w-12 h-6 rounded-full transition-all disabled:opacity-50 ${highAccuracy ? 'bg-[#00FF87]' : 'bg-[#1F2937]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${highAccuracy ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Start / Stop */}
        <button
          onClick={client.running ? client.stop : client.start}
          disabled={!selectedIdentifier && !client.running}
          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            client.running
              ? 'bg-[rgba(255,68,68,0.1)] border border-[rgba(255,68,68,0.2)] text-[#FF4444] hover:bg-[rgba(255,68,68,0.15)]'
              : 'bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] text-[#00FF87] hover:bg-[rgba(0,255,135,0.2)]'
          }`}
        >
          {client.running
            ? <><Square size={16} fill="currentColor" />Ndalo Transmetimin</>
            : <><Play size={16} fill="currentColor" />Fillo Transmetimin Live</>
          }
        </button>

        <p className="text-center text-[11px] font-mono text-[#7D8590] mt-4">
          Lokacioni transmetohet direkt në serverin tuaj Supabase. Asnjë palë e tretë.
        </p>
      </div>
    </div>
  )
}
