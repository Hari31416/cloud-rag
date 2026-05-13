import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Cpu, Sparkles, Zap } from 'lucide-react'
import type { QueryResponse } from '../lib/types'

interface QueryResultProps {
  result: QueryResponse
}

export function QueryResult({ result }: QueryResultProps) {
  const [showMetadata, setShowMetadata] = useState(false)

  return (
    <div className='bg-secondary/10 rounded-xl border border-primary/30 p-5 flex flex-col gap-4 relative overflow-hidden glow-card'>
      <div className='absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none' />

      <div className='flex items-start justify-between gap-2 border-b border-border/60 pb-3'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 p-1.5 rounded-lg border border-primary/20'>
            <Sparkles className='w-4 h-4 text-primary' />
          </div>
          <div>
            <h3 className='text-xs font-bold uppercase tracking-wider text-foreground'>
              Synthesized Answer
            </h3>
            <span className='text-[10px] text-muted-foreground block'>
              Generated asynchronously via top-ranked semantic chunks
            </span>
          </div>
        </div>

        <div className='flex items-center gap-1.5'>
          {result.cache.hit ? (
            <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 shrink-0'>
              <Zap className='w-2.5 h-2.5 fill-amber-400' /> Cache Hit
              {result.cache.similarity !== null && ` (${(result.cache.similarity * 100).toFixed(0)}%)`}
            </span>
          ) : (
            <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground border border-border flex items-center gap-1 shrink-0'>
              <Cpu className='w-2.5 h-2.5' /> Cache Miss
            </span>
          )}

          <span className='px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-background border border-border flex items-center gap-1 shrink-0'>
            <Clock className='w-2.5 h-2.5 text-primary' /> {result.retrieval.tookMs}ms
          </span>
        </div>
      </div>

      <div className='text-xs text-foreground leading-relaxed whitespace-pre-wrap font-medium bg-background/40 p-4 rounded-lg border border-border/40'>
        {result.answer || (
          <span className='text-muted-foreground italic'>
            Empty response payload returned by gateway engine.
          </span>
        )}
      </div>

      <div className='flex flex-col gap-1 pt-1'>
        <button
          type='button'
          onClick={() => setShowMetadata(!showMetadata)}
          className='flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary self-start font-medium transition-colors'
        >
          {showMetadata ? <ChevronUp className='w-3 h-3' /> : <ChevronDown className='w-3 h-3' />}
          {showMetadata ? 'Hide Envelopes & Routing Telemetry' : 'Inspect Envelopes & Routing Telemetry'}
        </button>

        {showMetadata && (
          <div className='grid grid-cols-2 gap-2 text-[10px] font-mono bg-background/80 p-2.5 rounded border border-border/60 mt-1 text-muted-foreground'>
            <div className='truncate'>
              <span className='text-foreground font-semibold block text-[9px]'>REQUEST ID</span>
              <span className='truncate block'>{result.requestId}</span>
            </div>
            <div className='truncate'>
              <span className='text-foreground font-semibold block text-[9px]'>TRACE ID</span>
              <span className='truncate block'>{result.traceId}</span>
            </div>
            <div className='col-span-2 truncate pt-1 border-t border-border/40'>
              <span className='text-foreground font-semibold block text-[9px]'>CACHE KEY</span>
              <span className='truncate block text-[9px] text-muted-foreground/80'>
                {result.cache.key || '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
