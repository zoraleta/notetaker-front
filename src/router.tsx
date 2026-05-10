import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/app-layout'
import { LoginPage } from '@/pages/login-page'
import { RegisterPage } from '@/pages/register-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { NoteEditorPage } from '@/pages/note-editor-page'
import { SettingsPage } from '@/pages/settings-page'
import { GraphPage } from '@/pages/graph-page'
import { GroupsPage } from '@/pages/groups-page'
import { hasAuthToken } from '@/features/auth/api'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!hasAuthToken()) {
    const from = encodeURIComponent(window.location.pathname)
    return <Navigate to={`/login?from=${from}`} replace />
  }
  return <>{children}</>
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  if (hasAuthToken()) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <RedirectIfAuth><LoginPage /></RedirectIfAuth>,
  },
  {
    path: '/register',
    element: <RedirectIfAuth><RegisterPage /></RedirectIfAuth>,
  },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'notes/:id', element: <NoteEditorPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'graph', element: <GraphPage /> },
      { path: 'groups', element: <GroupsPage /> },
    ],
  },
])
