import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEvents } from '@/hooks/useEvents'
import { Map, Cpu, Shield, Bell, Clock, Navigation, Radio, Settings, LogOut } from 'lucide-react'

export default function Layout() {
  const { profile, signOut, isAdmin } = useAuth()
  const { unreadCount } = useEvents()
  const location = useLocation()

  const adminNav = [
    { to: '/',          icon: Map,    label: 'Harta',    exact: true },
    { to: '/devices',   icon: Cpu,    label: 'Pajisjet' },
    { to: '/geofences', icon: Shield, label: 'Zonat' },
    { to: '/events',    icon: Bell,   label: 'Ngjarjet', badge: unreadCount },
    { to: '/history',   icon: Clock,  label: 'Historiku' },
    { to: '/client',    icon: Radio,  label: 'GPS' },
  ]

  const driverNav = [
    { to: '/',        icon: Map,   label: 'Harta',    exact: true },
    { to: '/devices', icon: Cpu,   label: 'Pajisjet' },
    { to: '/history', icon: Clock, label: 'Historiku' },
    { to: '/client',  icon: Radio, label: 'GPS' },
  ]

  const navItems = isAdmin ? adminNav : driverNav
  const mobileItems = navItems.slice(0, 4)

  const sidebarStyle: React.CSSProperties = {
    width: 64, minWidth: 64, display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '16px 0', gap: 4,
    borderRight: '1px solid rgba(255,255,255,0.08)',
    background: '#0D1117', zIndex: 50, flexShrink: 0,
  }

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    position: 'relative', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 8,
    textDecoration: 'none', transition: 'all 0.15s', width: '100%',
    background: active ? 'rgba(0,255,135,0.12)' : 'transparent',
    color: active ? '#00FF87' : '#7D8590',
  })

  return (
    <>
      {/* Responsive CSS injected inline */}
      <style>{`
        .trackar-sidebar { display: flex; }
        .trackar-bottomnav { display: none; }
        .trackar-main { padding-bottom: 0; }
        @media (max-width: 767px) {
          .trackar-sidebar { display: none !important; }
          .trackar-bottomnav { display: flex !important; }
          .trackar-main { padding-bottom: 56px; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0D1117' }}>

        {/* ── Desktop Sidebar ── */}
        <aside className="trackar-sidebar" style={sidebarStyle}>
          {/* Logo */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Navigation size={14} color="#00FF87" />
            </div>
          </div>

          {/* Role badge */}
          <div style={{
            fontSize: 7, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            padding: '2px 6px', borderRadius: 4, marginBottom: 8,
            background: isAdmin ? 'rgba(0,255,135,0.1)' : 'rgba(77,166,255,0.1)',
            color: isAdmin ? '#00FF87' : '#4DA6FF',
            border: isAdmin ? '1px solid rgba(0,255,135,0.2)' : '1px solid rgba(77,166,255,0.2)',
          }}>
            {isAdmin ? 'ADMIN' : 'DRIVER'}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 8px' }}>
            {navItems.map(({ to, icon: Icon, label, exact, badge }: any) => {
              const active = exact ? location.pathname === to : location.pathname.startsWith(to)
              return (
                <NavLink key={to} to={to} style={navLinkStyle(active)}>
                  {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: 20, background: '#00FF87', borderRadius: '0 2px 2px 0' }} />}
                  <div style={{ position: 'relative' }}>
                    <Icon size={16} />
                    {badge > 0 && (
                      <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#FF4444', borderRadius: '50%', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'monospace' }}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.3, lineHeight: 1 }}>{label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Bottom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 8px' }}>
            <NavLink to="/settings" style={({ isActive }) => navLinkStyle(isActive)}>
              <Settings size={16} /><span style={{ fontSize: 9, fontWeight: 600 }}>Config</span>
            </NavLink>
            <button onClick={signOut} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 8, background: 'transparent', border: 'none', color: '#7D8590', cursor: 'pointer', width: '100%' }}>
              <LogOut size={16} /><span style={{ fontSize: 9, fontWeight: 600 }}>Dil</span>
            </button>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px auto 0', cursor: 'default' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#00FF87' }}>
                {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="trackar-main" style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="trackar-bottomnav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 56, background: 'rgba(13,17,23,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        zIndex: 200, backdropFilter: 'blur(12px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        alignItems: 'stretch',
      }}>
        {mobileItems.map(({ to, icon: Icon, label, exact, badge }: any) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, textDecoration: 'none',
              color: active ? '#00FF87' : '#7D8590',
              fontSize: 9, fontWeight: 600, fontFamily: 'Syne, sans-serif',
              position: 'relative',
            }}>
              {active && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: '#00FF87', borderRadius: '0 0 2px 2px' }} />}
              <div style={{ position: 'relative' }}>
                <Icon size={22} />
                {badge > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 15, height: 15, background: '#FF4444', borderRadius: '50%', fontSize: 8, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          )
        })}

        {/* Settings */}
        <NavLink to="/settings" style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 3, textDecoration: 'none',
          color: location.pathname === '/settings' ? '#00FF87' : '#7D8590',
          fontSize: 9, fontWeight: 600, fontFamily: 'Syne, sans-serif', position: 'relative',
        }}>
          {location.pathname === '/settings' && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: '#00FF87', borderRadius: '0 0 2px 2px' }} />}
          <Settings size={22} /><span>Config</span>
        </NavLink>

        {/* Logout */}
        <button onClick={signOut} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 3, background: 'transparent', border: 'none',
          color: '#7D8590', fontSize: 9, fontWeight: 600, fontFamily: 'Syne, sans-serif',
          cursor: 'pointer',
        }}>
          <LogOut size={22} /><span>Dil</span>
        </button>
      </nav>
    </>
  )
}
