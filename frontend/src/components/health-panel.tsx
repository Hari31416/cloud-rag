import { AlertTriangle, CheckCircle, Database, HardDrive, Cpu } from 'lucide-react'
import { useHealth } from '../hooks/use-health'
import { useReady } from '../hooks/use-ready'
import { cn } from '../lib/utils'

export function HealthPanel() {
  const { data: healthData, isError: isHealthError } = useHealth()
  const { data: readyData, isError: isReadyError } = useReady()

  const renderStatusItem = (label: string, statusText?: string, isErr?: boolean) => {
    const isOk = statusText?.toLowerCase() === 'ok' || statusText?.toLowerCase() === 'healthy'
    return (
      <div className='flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/50'>
        <span className='text-xs font-medium text-muted-foreground'>{label}</span>
        <div className='flex items-center gap-1.5'>
          {isErr ? (
            <span className='flex items-center gap-1 text-xs font-bold text-rose-500'>
              <AlertTriangle className='w-3.5 h-3.5' />
              ERR
            </span>
          ) : isOk ? (
            <span className='flex items-center gap-1 text-xs font-bold text-primary'>
              <CheckCircle className='w-3.5 h-3.5' />
              OK
            </span>
          ) : (
            <span className='text-xs font-semibold text-amber-500'>
              {statusText || 'PENDING'}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='bg-secondary/10 rounded-xl border border-border p-4 flex flex-col gap-3'>
      <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
        <Cpu className='w-3.5 h-3.5 text-primary' />
        System Health Architecture
      </h3>

      <div className='grid grid-cols-2 gap-2'>
        {renderStatusItem('Gateway API', healthData?.status, isHealthError)}
        {renderStatusItem('Global Ready', readyData?.status, isReadyError)}
      </div>

      <div className='pt-2 border-t border-border/60 flex flex-col gap-2'>
        <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
          Dependency Breakdown
        </span>
        <div className='grid grid-cols-3 gap-2'>
          <div className='p-2 rounded bg-background/50 border border-border flex flex-col gap-1 items-center justify-center text-center'>
            <Database className='w-3.5 h-3.5 text-primary/80' />
            <span className='text-[10px] text-muted-foreground font-medium'>Redis Queue</span>
            <span className={cn('text-[11px] font-bold', readyData?.redis === 'ok' ? 'text-primary' : 'text-amber-500')}>
              {readyData?.redis ? readyData.redis.toUpperCase() : '—'}
            </span>
          </div>

          <div className='p-2 rounded bg-background/50 border border-border flex flex-col gap-1 items-center justify-center text-center'>
            <Database className='w-3.5 h-3.5 text-emerald-400' />
            <span className='text-[10px] text-muted-foreground font-medium'>Vector DB</span>
            <span className={cn('text-[11px] font-bold', readyData?.vectorDb === 'ok' ? 'text-primary' : 'text-amber-500')}>
              {readyData?.vectorDb ? readyData.vectorDb.toUpperCase() : '—'}
            </span>
          </div>

          <div className='p-2 rounded bg-background/50 border border-border flex flex-col gap-1 items-center justify-center text-center'>
            <HardDrive className='w-3.5 h-3.5 text-sky-400' />
            <span className='text-[10px] text-muted-foreground font-medium'>Object Storage</span>
            <span className={cn('text-[11px] font-bold', readyData?.storage === 'ok' ? 'text-primary' : 'text-amber-500')}>
              {readyData?.storage ? readyData.storage.toUpperCase() : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
