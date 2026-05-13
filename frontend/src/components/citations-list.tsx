import { useState } from 'react'
import { Bookmark, ChevronDown, ChevronUp, FileText, Hash, Layers } from 'lucide-react'
import type { SourceReference } from '../lib/types'

interface CitationsListProps {
  sources: SourceReference[]
}

export function CitationsList({ sources }: CitationsListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className='bg-secondary/10 rounded-xl border border-border p-5 flex flex-col gap-4'>
      <div>
        <h3 className='text-sm font-bold text-foreground flex items-center gap-1.5'>
          <Bookmark className='w-4 h-4 text-primary' /> Source Citations Mapping
        </h3>
        <p className='text-xs text-muted-foreground'>
          Ranked semantic text chunks matching the embedding cosine distance metric.
        </p>
      </div>

      {sources.length === 0 ? (
        <div className='p-6 text-center border border-dashed border-border rounded-lg bg-background/20 flex flex-col items-center justify-center gap-2'>
          <Layers className='w-8 h-8 text-muted-foreground/50' />
          <span className='text-xs font-medium text-muted-foreground'>
            Zero matching semantic source citations retrieved for this query.
          </span>
        </div>
      ) : (
        <div className='flex flex-col gap-2.5'>
          {sources.map((source, index) => {
            const isExpanded = expandedIndex === index
            const metadataEntries = Object.entries(source.metadata || {})

            return (
              <div
                key={`${source.chunkId}-${index}`}
                className='flex flex-col rounded-lg border border-border bg-background/40 overflow-hidden hover:border-primary/30 transition-colors'
              >
                <button
                  type='button'
                  onClick={() => toggleExpand(index)}
                  className='flex items-center justify-between p-3 text-left bg-secondary/20 hover:bg-secondary/40 transition-colors focus:outline-none w-full gap-2'
                >
                  <div className='flex items-center gap-2 min-w-0'>
                    <FileText className='w-4 h-4 text-primary shrink-0' />
                    <span className='text-xs font-bold text-foreground truncate'>
                      {source.title || source.sourceId || `Source Chunk #${index + 1}`}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 shrink-0'>
                    <span className='px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20'>
                      Score: {source.score.toFixed(3)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className='w-3.5 h-3.5 text-muted-foreground' />
                    ) : (
                      <ChevronDown className='w-3.5 h-3.5 text-muted-foreground' />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className='p-3 flex flex-col gap-3 border-t border-border/40'>
                    <div className='grid grid-cols-2 gap-2 text-[10px] font-mono bg-secondary/10 p-2 rounded border border-border/30 text-muted-foreground'>
                      <div className='truncate'>
                        <span className='text-foreground font-semibold block text-[9px]'>CHUNK ID</span>
                        <span className='truncate block'>{source.chunkId}</span>
                      </div>
                      <div className='truncate'>
                        <span className='text-foreground font-semibold block text-[9px]'>DOC HASH</span>
                        <span className='truncate block flex items-center gap-0.5'>
                          <Hash className='w-2.5 h-2.5 text-primary' />
                          {source.documentHash.substring(0, 16)}...
                        </span>
                      </div>
                    </div>

                    {metadataEntries.length > 0 && (
                      <div className='flex flex-col gap-1'>
                        <span className='text-[9px] font-bold uppercase tracking-widest text-muted-foreground'>
                          Attached Metadata
                        </span>
                        <div className='flex flex-wrap gap-1'>
                          {metadataEntries.map(([k, v]) => (
                            <span
                              key={k}
                              className='px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono text-muted-foreground'
                            >
                              <strong className='text-foreground font-semibold'>{k}:</strong>{' '}
                              {String(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className='flex flex-col gap-1 pt-1'>
                      <span className='text-[9px] font-bold uppercase tracking-widest text-muted-foreground'>
                        Raw Chunk Text Preview
                      </span>
                      <div className='bg-background/80 p-2.5 rounded border border-border/50 text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto select-text'>
                        {source.content || (
                          <span className='text-muted-foreground italic'>[Empty Chunk Content]</span>
                        )}
                      </div>
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
