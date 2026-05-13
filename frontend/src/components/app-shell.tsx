import { useState, type ReactNode } from 'react'
import { FileText, Search } from 'lucide-react'
import { TopBar } from './top-bar'
import { HealthPanel } from './health-panel'
import { cn } from '../lib/utils'

interface AppShellProps {
  ingestContent: ReactNode
  queryContent: ReactNode
}

export function AppShell({ ingestContent, queryContent }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<'ingest' | 'query'>('ingest')

  return (
    <div className='min-h-screen flex flex-col bg-background'>
      <TopBar />

      <main className='flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6'>
        <section>
          <HealthPanel />
        </section>

        <section className='flex flex-col gap-4'>
          <div className='border-b border-border flex items-center gap-2 px-1'>
            <button
              type='button'
              onClick={() => setActiveTab('ingest')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all select-none focus:outline-none',
                activeTab === 'ingest'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60',
              )}
            >
              <FileText className='w-4 h-4' />
              Document Ingestion Telemetry
            </button>

            <button
              type='button'
              onClick={() => setActiveTab('query')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all select-none focus:outline-none',
                activeTab === 'query'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60',
              )}
            >
              <Search className='w-4 h-4' />
              Query & Citations Workspace
            </button>
          </div>

          <div className='mt-2'>
            <div className={cn(activeTab === 'ingest' ? 'block' : 'hidden')}>
              {ingestContent}
            </div>
            <div className={cn(activeTab === 'query' ? 'block' : 'hidden')}>
              {queryContent}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
