import { useState, useEffect, type ReactNode } from 'react'
import {
  Search,
  FileText,
  Activity,
  Zap,
  Moon,
  Sun,
  CheckCircle2,
  ServerCrash
} from 'lucide-react'
import { useReady } from '../hooks/use-ready'
import { getEnvironmentBadge } from '../lib/env'
import { cn } from '../lib/utils'

interface AppShellProps {
  queryContent: ReactNode
  ingestContent: ReactNode
  healthContent: ReactNode
  onResetWorkspace?: () => void
}

export function AppShell({
  queryContent,
  ingestContent,
  healthContent
}: AppShellProps) {
  // Tabs in the exact requested order
  const [activeTab, setActiveTab] = useState<'query' | 'ingest' | 'health'>('query')
  const [isDarkMode, setIsDarkMode] = useState(false)

  const { data: readyData, isPending: isReadyPending, isError: isReadyError } = useReady()
  const badge = getEnvironmentBadge()

  // Initialize or toggle dark mode on document element
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return next
    })
  }

  // Ensure clean background styling
  useEffect(() => {
    // Default to premium light mode matching AskAtlas AI aesthetic unless explicitly toggled
    document.documentElement.classList.remove('dark')
  }, [])

  return (
    <div className='flex h-screen w-full bg-background overflow-hidden text-foreground antialiased'>
      {/* Left Sidebar */}
      <aside className='w-64 shrink-0 border-r border-border bg-secondary/20 flex flex-col justify-between p-4 z-20'>
        <div className='flex flex-col gap-8'>
          {/* Brand Header incorporating required Environment API visibility */}
          <div className='flex items-center gap-2.5 px-2 pt-2'>
            <div className='flex items-center justify-center p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0'>
              <Zap className='w-5 h-5 fill-amber-500' />
            </div>
            <div className='flex flex-col truncate'>
              <span className='font-bold text-base tracking-tight text-foreground truncate'>
                CloudRAG AI
              </span>
              <span className='text-[9px] uppercase tracking-wider font-extrabold text-primary'>
                {badge}
              </span>
            </div>
          </div>

          {/* Navigation Links / Tabs */}
          <div className='flex flex-col gap-1'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1'>
              Knowledge Engine
            </span>

            {/* Tab 1: Query */}
            <button
              type='button'
              onClick={() => setActiveTab('query')}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left focus:outline-none',
                activeTab === 'query'
                  ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                  : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
              )}
            >
              <Search className='w-4 h-4 shrink-0' />
              <span className='truncate'>Query</span>
            </button>

            {/* Tab 2: Document Ingestion */}
            <button
              type='button'
              onClick={() => setActiveTab('ingest')}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left focus:outline-none',
                activeTab === 'ingest'
                  ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                  : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
              )}
            >
              <FileText className='w-4 h-4 shrink-0' />
              <span className='truncate'>Document Ingestion</span>
            </button>

            {/* Tab 3: System Health */}
            <button
              type='button'
              onClick={() => setActiveTab('health')}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left focus:outline-none',
                activeTab === 'health'
                  ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                  : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
              )}
            >
              <Activity className='w-4 h-4 shrink-0' />
              <span className='truncate'>System Health</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className='flex flex-col gap-3 pt-4 border-t border-border/60'>
          {/* Live Readiness Telemetry */}
          <div className='flex items-center justify-between px-2 py-1.5 rounded-lg bg-background/50 border border-border/40'>
            <span className='text-[10px] font-medium text-muted-foreground'>
              Gateway Status
            </span>
            <div className='flex items-center gap-1'>
              {isReadyPending ? (
                <span className='flex items-center gap-1 text-[10px] font-bold text-amber-500'>
                  <span className='w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping' />
                  PING
                </span>
              ) : isReadyError ? (
                <span className='flex items-center gap-1 text-[10px] font-bold text-rose-500'>
                  <ServerCrash className='w-3 h-3' />
                  OFF
                </span>
              ) : (
                <span className='flex items-center gap-1 text-[10px] font-bold text-primary'>
                  <CheckCircle2 className='w-3 h-3' />
                  {readyData?.status ? readyData.status.toUpperCase() : 'OK'}
                </span>
              )}
            </div>
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            type='button'
            onClick={toggleDarkMode}
            className='flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors text-left focus:outline-none'
          >
            {isDarkMode ? (
              <>
                <Sun className='w-4 h-4 text-amber-400 shrink-0' />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className='w-4 h-4 shrink-0' />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Pane without redundant administrative headers */}
      <div className='flex-1 flex flex-col h-full overflow-hidden bg-background'>
        {/* Scrollable Body Container */}
        <main className='flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col items-center'>
          <div className='w-full max-w-4xl flex flex-col gap-8 pb-12 transition-all'>
            {activeTab === 'query' && queryContent}
            {activeTab === 'ingest' && ingestContent}
            {activeTab === 'health' && healthContent}
          </div>
        </main>
      </div>
    </div>
  )
}
