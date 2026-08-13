import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <div className="mx-auto flex w-full max-w-[1800px] flex-1 gap-6 p-4 lg:p-6">
          <Sidebar />
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
