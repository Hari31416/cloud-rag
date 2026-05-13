import { Compass, Database, Search, Cpu } from 'lucide-react'

export function EmptyState() {
  return (
    <div className='bg-secondary/5 rounded-xl border border-dashed border-border p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[350px]'>
      <div className='bg-secondary/30 p-3 rounded-2xl border border-border'>
        <Compass className='w-8 h-8 text-primary animate-pulse' />
      </div>

      <div className='max-w-md flex flex-col gap-1.5'>
        <h3 className='text-sm font-bold text-foreground'>Query Workspace Idle</h3>
        <p className='text-xs text-muted-foreground leading-relaxed'>
          Submit a semantic prompt via the left configuration control to search available ingestion chunks and trigger answer computation.
        </p>
      </div>

      <div className='grid grid-cols-3 gap-3 w-full max-w-md pt-2'>
        <div className='flex flex-col items-center gap-1 p-2 rounded bg-background/40 border border-border/40'>
          <Database className='w-3.5 h-3.5 text-primary' />
          <span className='text-[10px] text-muted-foreground font-medium'>Vector Space</span>
        </div>
        <div className='flex flex-col items-center gap-1 p-2 rounded bg-background/40 border border-border/40'>
          <Search className='w-3.5 h-3.5 text-emerald-400' />
          <span className='text-[10px] text-muted-foreground font-medium'>Cosine Sim</span>
        </div>
        <div className='flex flex-col items-center gap-1 p-2 rounded bg-background/40 border border-border/40'>
          <Cpu className='w-3.5 h-3.5 text-sky-400' />
          <span className='text-[10px] text-muted-foreground font-medium'>Deterministic</span>
        </div>
      </div>
    </div>
  )
}
