import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import MapPage from '@/pages/MapPage'
import DevicesPage from '@/pages/DevicesPage'
import GeofencesPage from '@/pages/GeofencesPage'
import EventsPage from '@/pages/EventsPage'
import HistoryPage from '@/pages/HistoryPage'
import ClientPage from '@/pages/ClientPage'
import SettingsPage from '@/pages/SettingsPage'
import DriverDashboard from '@/pages/DriverDashboard'

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0D1117]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#7D8590] text-sm font-mono">Duke ngarkuar...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function HomeRoute() {
  const { profile, loading, user } = useAuth()

  // Auth still loading
  if (loading) return <LoadingScreen />

  // User logged in but profile not loaded yet — wait max 3s then fallback
  if (user && !profile) {
    return <LoadingScreen />
  }

  // No user → redirect to login
  if (!user) return <Navigate to="/login" replace />

  // Route based on role
  return profile?.role === 'admin' ? <MapPage /> : <DriverDashboard />
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!profile) return <LoadingScreen />
  if (profile.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomeRoute />} />
        <Route path="devices"   element={<DevicesPage />} />
        <Route path="history"   element={<HistoryPage />} />
        <Route path="client"    element={<ClientPage />} />
        <Route path="settings"  element={<SettingsPage />} />
        <Route path="geofences" element={<AdminOnly><GeofencesPage /></AdminOnly>} />
        <Route path="events"    element={<AdminOnly><EventsPage /></AdminOnly>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
