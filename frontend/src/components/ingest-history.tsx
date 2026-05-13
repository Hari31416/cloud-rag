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
    <div className='bg-secondary/10 rounded-xl border border-border p-5 flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-sm font-bold text-foreground flex items-center gap-1.5'>
            <Layers className='w-4 h-4 text-primary' />
            Session Ingestion Telemetry
          </h3>
          <p className='text-xs text-muted-foreground'>
            Reflecting active submissions accepted inside this browser session window.
          </p>
        </div>

        {entries.length > 0 && (
          <button
            type='button'
            onClick={onClearHistory}
            className='flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-rose-500 bg-secondary/40 px-2 py-1 rounded border border-border hover:border-rose-500/30 transition-colors'
          >
            <Trash2 className='w-3 h-3' /> Clear Telemetry
          </button>
        )}
      </div>

      <div className='p-2.5 rounded bg-background/30 border border-border/40 text-[11px] text-muted-foreground flex flex-col gap-1'>
        <span className='font-bold text-amber-500/90 flex items-center gap-1'>
          ⚠️ API Boundary Notice
        </span>
        As per gateway specifications, asynchronous processing statuses do not emit live worker completion blocks yet. Tasks reside securely in persistent message broker queues.
      </div>

      {entries.length === 0 ? (
        <div className='p-6 text-center border border-dashed border-border rounded-lg bg-background/20 flex flex-col items-center justify-center gap-2'>
          <FileText className='w-8 h-8 text-muted-foreground/50' />
          <span className='text-xs font-medium text-muted-foreground'>
            No local ingestion requests logged during this tab session.
          </span>
        </div>
      ) : (
        <div className='flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1'>
          {entries.map((entry, idx) => {
            const isExpanded = expandedRowIndex === idx
            return (
              <div
                key={`${entry.taskId}-${idx}`}
                className='flex flex-col gap-2 p-3 rounded-lg bg-background/50 border border-border hover:border-primary/40 transition-colors'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex flex-col min-w-0'>
                    <span className='text-xs font-bold text-foreground truncate'>
                      {entry.title || entry.sourceId || 'Untitled Document Artifact'}
                    </span>
                    <span className='text-[10px] text-muted-foreground font-mono flex items-center gap-1'>
                      <Calendar className='w-3 h-3' />
                      {new Date(entry.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 shrink-0'>
                    <CheckCircle2 className='w-2.5 h-2.5' /> Accepted
                  </span>
                </div>

                <div className='grid grid-cols-2 gap-2 text-[10px] font-mono bg-secondary/30 p-1.5 rounded'>
                  <div className='truncate'>
                    <span className='text-muted-foreground block text-[9px]'>TASK ID</span>
                    <span className='text-foreground truncate block'>{entry.taskId}</span>
                  </div>
                  <div className='truncate'>
                    <span className='text-muted-foreground block text-[9px]'>HASH</span>
                    <span className='text-foreground truncate block flex items-center gap-0.5'>
                      <Hash className='w-2.5 h-2.5 text-primary' />
                      {entry.documentHash.substring(0, 16)}...
                    </span>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => toggleRow(idx)}
                  className='flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary self-start font-medium transition-colors'
                >
                  {isExpanded ? <ChevronUp className='w-3 h-3' /> : <ChevronDown className='w-3 h-3' />}
                  {isExpanded ? 'Hide UUID Identifiers' : 'Show Request / Trace Envelopes'}
                </button>

                {isExpanded && (
                  <div className='flex flex-col gap-0.5 text-[10px] font-mono text-muted-foreground pt-1.5 border-t border-border/40'>
                    <div>
                      <span className='text-foreground font-semibold'>Req ID:</span> {entry.requestId}
                    </div>
                    <div>
                      <span className='text-foreground font-semibold'>Trace ID:</span> {entry.traceId}
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
