import { Activity, CheckCircle2, Cloud, ServerCrash } from 'lucide-react'
import { useReady } from '../hooks/use-ready'
import { getEnvironmentBadge } from '../lib/env'

export function TopBar() {
  const { data, isPending, isError } = useReady()
  const badge = getEnvironmentBadge()

  return (
    <header className='border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <div className='bg-primary/10 p-2 rounded-xl border border-primary/20'>
          <Cloud className='w-6 h-6 text-primary' />
        </div>
        <div>
          <h1 className='text-lg font-bold tracking-tight text-foreground flex items-center gap-2'>
            CloudRAG
            <span className='text-xs uppercase px-2 py-0.5 rounded-full font-semibold bg-secondary text-secondary-foreground border border-border'>
              {badge}
            </span>
          </h1>
        </div>
      </div>

      <div className='flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-border'>
        <span className='text-xs font-medium text-muted-foreground'>Gateway Readiness:</span>
        {isPending && (
          <span className='flex items-center gap-1.5 text-xs text-amber-500 font-semibold'>
            <Activity className='w-3.5 h-3.5 animate-pulse' />
            Checking
          </span>
        )}
        {isError && (
          <span className='flex items-center gap-1.5 text-xs text-rose-500 font-semibold'>
            <ServerCrash className='w-3.5 h-3.5' />
            Offline
          </span>
        )}
        {data && (
          <span className='flex items-center gap-1.5 text-xs text-primary font-semibold'>
            <CheckCircle2 className='w-3.5 h-3.5' />
            {data.status.toUpperCase()}
          </span>
        )}
      </div>
    </header>
  )
}
