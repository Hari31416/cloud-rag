import { useState } from 'react'
import { Calendar, CheckCircle2, ChevronDown, ChevronUp, FileText, Hash, Layers, Trash2 } from 'lucide-react'
import type { LocalIngestEntry } from '../lib/types'

interface IngestHistoryProps {
  entries: LocalIngestEntry[]
  onClearHistory: () => void
}

export function IngestHistory({ entries, onClearHistory }: IngestHistoryProps) {
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null)

  const toggleRow = (index: number) => {
    setExpandedRowIndex(expandedRowIndex === index ? null : index)
  }

  return (
    <div className='flex flex-col gap-4 p-5 rounded-2xl bg-secondary/10 border border-border w-full max-w-2xl mt-4 shadow-sm animate-fadeIn'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='p-1.5 rounded-lg bg-primary/10 text-primary'>
            <Layers className='w-4 h-4' />
          </div>
          <div>
            <h3 className='text-xs font-bold text-foreground uppercase tracking-wider'>
              Session Ingestion Telemetry
            </h3>
            <p className='text-[11px] text-muted-foreground'>
              Reflecting active submissions accepted inside this browser session
            </p>
          </div>
        </div>

        {entries.length > 0 && (
          <button
            type='button'
            onClick={onClearHistory}
            className='flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-rose-500 bg-background px-2.5 py-1 rounded-lg border border-border hover:border-rose-500/30 transition-colors shadow-sm focus:outline-none'
          >
            <Trash2 className='w-3 h-3' /> Clear
          </button>
        )}
      </div>

      <div className='p-3 rounded-xl bg-background/50 border border-border/60 text-[11px] text-muted-foreground leading-relaxed flex flex-col gap-0.5'>
        <span className='font-bold text-amber-500 flex items-center gap-1'>
          ⚠️ API Lifecycle Constraints
        </span>
        Asynchronous processing status endpoints do not emit live pipeline callbacks yet. Payloads reside securely in highly available message broker queues.
      </div>

      {entries.length === 0 ? (
        <div className='p-6 text-center border border-dashed border-border/80 rounded-xl bg-background/20 flex flex-col items-center justify-center gap-2'>
          <FileText className='w-6 h-6 text-muted-foreground/40' />
          <span className='text-xs font-medium text-muted-foreground'>
            No local ingestion requests logged during this tab session.
          </span>
        </div>
      ) : (
        <div className='flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1'>
          {entries.map((entry, idx) => {
            const isExpanded = expandedRowIndex === idx
            return (
              <div
                key={`${entry.taskId}-${idx}`}
                className='flex flex-col gap-2 p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors shadow-xs'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-col min-w-0'>
                    <span className='text-xs font-bold text-foreground truncate'>
                      {entry.title || entry.sourceId || 'Untitled Document Artifact'}
                    </span>
                    <span className='text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5'>
                      <Calendar className='w-3 h-3 text-muted-foreground/70' />
                      {new Date(entry.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 shrink-0'>
                    <CheckCircle2 className='w-2.5 h-2.5' /> Accepted
                  </span>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono bg-secondary/20 p-2 rounded-lg border border-border/40'>
                  <div className='truncate'>
                    <span className='text-muted-foreground block text-[9px] font-sans font-semibold'>TASK ID</span>
                    <span className='text-foreground truncate block font-medium'>{entry.taskId}</span>
                  </div>
                  <div className='truncate'>
                    <span className='text-muted-foreground block text-[9px] font-sans font-semibold'>HASH</span>
                    <span className='text-foreground truncate block font-medium flex items-center gap-0.5'>
                      <Hash className='w-2.5 h-2.5 text-primary shrink-0' />
                      {entry.documentHash.substring(0, 16)}...
                    </span>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => toggleRow(idx)}
                  className='flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary self-start font-semibold transition-colors focus:outline-none mt-0.5'
                >
                  {isExpanded ? <ChevronUp className='w-3 h-3' /> : <ChevronDown className='w-3 h-3' />}
                  {isExpanded ? 'Hide Trace Details' : 'Show Trace Details'}
                </button>

                {isExpanded && (
                  <div className='flex flex-col gap-1 text-[10px] font-mono text-muted-foreground pt-2 border-t border-border/40 mt-0.5'>
                    <div className='truncate'>
                      <strong className='text-foreground font-sans'>Req ID:</strong> {entry.requestId}
                    </div>
                    <div className='truncate'>
                      <strong className='text-foreground font-sans'>Trace ID:</strong> {entry.traceId}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
