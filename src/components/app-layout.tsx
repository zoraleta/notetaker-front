import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './app-sidebar'
import { CmdK } from './cmd-k'

export function AppLayout() {
  const [cmdKOpen, setCmdKOpen] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdKOpen(true)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar onCmdK={() => setCmdKOpen(true)} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <CmdK open={cmdKOpen} onOpenChange={setCmdKOpen} />
    </div>
  )
}
