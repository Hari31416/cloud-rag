import { CheckCircle2, Database, HardDrive, Cpu, Activity, ServerCrash } from 'lucide-react'
import { useHealth } from '../hooks/use-health'
import { useReady } from '../hooks/use-ready'
import { cn } from '../lib/utils'

export function HealthPanel() {
  const { data: healthData, isError: isHealthError, isPending: isHealthPending } = useHealth()
  const { data: readyData, isError: isReadyError, isPending: isReadyPending } = useReady()

  const renderStatusCard = (title: string, statusText?: string, isErr?: boolean, isPend?: boolean) => {
    const isOk = statusText?.toLowerCase() === 'ok' || statusText?.toLowerCase() === 'healthy'
    return (
      <div className='flex flex-col gap-2 p-5 rounded-2xl bg-secondary/10 border border-border shadow-sm relative overflow-hidden'>
        <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
          {title}
        </span>
        <div className='flex items-center justify-between mt-1'>
          <span className='text-lg font-extrabold tracking-tight text-foreground'>
            {isErr ? 'CRITICAL' : isPend ? 'CHECKING' : statusText ? statusText.toUpperCase() : 'UNKNOWN'}
          </span>
          <div className='flex items-center gap-1.5'>
            {isErr ? (
              <span className='flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20'>
                <ServerCrash className='w-3.5 h-3.5 shrink-0' /> ERR
              </span>
            ) : isOk ? (
                <span className='flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20'>
                  <CheckCircle2 className='w-3.5 h-3.5 shrink-0' /> OK
                </span>
              ) : (
              <span className='flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20'>
                <Activity className='w-3.5 h-3.5 shrink-0 animate-spin' /> PEND
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 w-full animate-fadeIn'>
      {/* Header Info */}
      <div className='flex flex-col gap-1.5 text-center items-center'>
        <div className='p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary inline-flex mb-1'>
          <Cpu className='w-6 h-6' />
        </div>
        <h2 className='text-xl font-extrabold tracking-tight text-foreground'>
          System Telemetry & Gateway Health
        </h2>
        <p className='text-xs text-muted-foreground max-w-md'>
          Real-time diagnostics tracking gateway operational engine availability and polyglot persistent boundaries.
        </p>
      </div>

      {/* High-Level Status Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2'>
        {renderStatusCard('Gateway HTTP API', healthData?.status, isHealthError, isHealthPending)}
        {renderStatusCard('Global Cluster Readiness', readyData?.status, isReadyError, isReadyPending)}
      </div>

      {/* Dependency Architecture Breakdown */}
      <div className='flex flex-col gap-4 p-6 rounded-2xl bg-secondary/5 border border-border mt-2'>
        <span className='text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2'>
          <Database className='w-4 h-4 text-primary' /> Dependency Architecture Subsystems
        </span>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Redis Queue */}
          <div className='flex flex-col gap-2 p-4 rounded-xl bg-background border border-border'>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 rounded-lg bg-primary/10 text-primary'>
                <Database className='w-4 h-4' />
              </div>
              <span className='text-xs font-bold text-foreground'>Redis Broker</span>
            </div>
            <div className='flex items-center justify-between pt-2 border-t border-border/40 mt-1'>
              <span className='text-[10px] text-muted-foreground font-medium'>Status</span>
              <span
                className={cn(
                  'text-xs font-extrabold font-mono',
                  readyData?.redis === 'ok' ? 'text-primary' : 'text-amber-500'
                )}
              >
                {readyData?.redis ? readyData.redis.toUpperCase() : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Vector Database */}
          <div className='flex flex-col gap-2 p-4 rounded-xl bg-background border border-border'>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500'>
                <Database className='w-4 h-4' />
              </div>
              <span className='text-xs font-bold text-foreground'>Vector Engine</span>
            </div>
            <div className='flex items-center justify-between pt-2 border-t border-border/40 mt-1'>
              <span className='text-[10px] text-muted-foreground font-medium'>Status</span>
              <span
                className={cn(
                  'text-xs font-extrabold font-mono',
                  readyData?.vectorDb === 'ok' ? 'text-primary' : 'text-amber-500'
                )}
              >
                {readyData?.vectorDb ? readyData.vectorDb.toUpperCase() : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Object Storage */}
          <div className='flex flex-col gap-2 p-4 rounded-xl bg-background border border-border'>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 rounded-lg bg-sky-500/10 text-sky-500'>
                <HardDrive className='w-4 h-4' />
              </div>
              <span className='text-xs font-bold text-foreground'>MinIO Storage</span>
            </div>
            <div className='flex items-center justify-between pt-2 border-t border-border/40 mt-1'>
              <span className='text-[10px] text-muted-foreground font-medium'>Status</span>
              <span
                className={cn(
                  'text-xs font-extrabold font-mono',
                  readyData?.storage === 'ok' ? 'text-primary' : 'text-amber-500'
                )}
              >
                {readyData?.storage ? readyData.storage.toUpperCase() : 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        <div className='text-[11px] text-muted-foreground text-center italic pt-2'>
          Polling telemetry automatically refreshes every 15 seconds.
        </div>
      </div>
    </div>
  )
}
