import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-10 px-4 pb-24 pt-8 lg:px-8 lg:pb-10">
          <Sidebar />
          <main id="main-content" className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
