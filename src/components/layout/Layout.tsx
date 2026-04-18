import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEvents } from '@/hooks/useEvents'
import {
  Map, Cpu, Shield, Bell, Clock, Navigation, Settings, LogOut, Radio
} from 'lucide-react'

const navItems = [
  { to: '/',           icon: Map,        label: 'Harta Live',  exact: true },
  { to: '/devices',    icon: Cpu,        label: 'Pajisjet' },
  { to: '/geofences',  icon: Shield,     label: 'Zonat' },
  { to: '/events',     icon: Bell,       label: 'Ngjarjet' },
  { to: '/history',    icon: Clock,      label: 'Historiku' },
  { to: '/client',     icon: Radio,      label: 'GPS Client' },
]

export default function Layout() {
  const { profile, signOut, isAdmin } = useAuth()
  const { unreadCount } = useEvents()
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-[#0D1117]">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-4 gap-1 border-r border-white/[0.08] bg-[#0D1117] z-50">
        {/* Logo */}
        <div className="mb-4 flex flex-col items-center">
          <div className="w-8 h-8 rounded-lg bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] flex items-center justify-center">
            <Navigation size={14} className="text-[#00FF87]" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1 w-full px-2">
          {navItems.map(({ to, icon: Icon, label, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to} to={to}
                className={`relative flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all group ${
                  active
                    ? 'bg-[rgba(0,255,135,0.12)] text-[#00FF87]'
                    : 'text-[#7D8590] hover:text-[#E6EDF3] hover:bg-white/[0.04]'
                }`}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00FF87] rounded-r-full" />}
                <div className="relative">
                  <Icon size={16} />
                  {to === '/events' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF4444] rounded-full text-[8px] font-mono font-bold flex items-center justify-center text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-display font-semibold leading-none tracking-tight">{label}</span>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#161B22] border border-white/[0.08] rounded-md text-[11px] font-display whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {label}
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col gap-1 w-full px-2">
          <NavLink to="/settings" className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all group ${isActive ? 'bg-[rgba(0,255,135,0.12)] text-[#00FF87]' : 'text-[#7D8590] hover:text-[#E6EDF3] hover:bg-white/[0.04]'}`
          }>
            <Settings size={16} />
            <span className="text-[9px] font-display font-semibold">Cilësimet</span>
          </NavLink>

          <button
            onClick={signOut}
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[#7D8590] hover:text-[#FF4444] hover:bg-[rgba(255,68,68,0.08)] transition-all group w-full"
          >
            <LogOut size={16} />
            <span className="text-[9px] font-display font-semibold">Dil</span>
          </button>

          {/* Avatar */}
          <div className="mt-2 w-8 h-8 rounded-full bg-[rgba(0,255,135,0.12)] border border-[rgba(0,255,135,0.2)] flex items-center justify-center mx-auto cursor-pointer" title={profile?.full_name ?? 'User'}>
            <span className="text-[10px] font-bold text-[#00FF87]">
              {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
