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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0D1117]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#00FF87] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#7D8590] text-sm font-mono">Duke ngarkuar...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<MapPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="geofences" element={<GeofencesPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="client" element={<ClientPage />} />
        <Route path="settings" element={<SettingsPage />} />
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
