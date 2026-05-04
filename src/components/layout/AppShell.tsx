import { ReactNode } from 'react'

interface AppShellProps {
  leftPanel: ReactNode
  mainStage: ReactNode
}

export function AppShell({ leftPanel, mainStage }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-bg">
      <aside className="w-[280px] flex-none border-r border-ink-border bg-ink-surface flex flex-col">
        {leftPanel}
      </aside>
      <main className="flex-1 overflow-hidden flex items-center justify-center">
        {mainStage}
      </main>
    </div>
  )
}
