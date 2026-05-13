import { useState } from 'react'
import { Bookmark, ChevronDown, ChevronUp, FileText, Hash, Layers } from 'lucide-react'
import type { SourceReference } from '../lib/types'
import { cn } from '../lib/utils'

interface CitationsListProps {
  sources: SourceReference[]
}

export function CitationsList({ sources }: CitationsListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className='flex flex-col gap-4 p-5 rounded-2xl bg-secondary/5 border border-border w-full animate-fadeIn mt-2'>
      <div className='flex items-center gap-2'>
        <div className='p-1.5 rounded-lg bg-primary/10 text-primary'>
          <Bookmark className='w-4 h-4' />
        </div>
        <div>
          <h3 className='text-xs font-bold text-foreground uppercase tracking-wider'>
            Source Citations Mapping
          </h3>
          <p className='text-[11px] text-muted-foreground'>
            Ranked semantic text chunks matching the cosine distance objective function
          </p>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className='p-6 text-center border border-dashed border-border/80 rounded-xl bg-background/20 flex flex-col items-center justify-center gap-2'>
          <Layers className='w-6 h-6 text-muted-foreground/40' />
          <span className='text-xs font-medium text-muted-foreground'>
            Zero matching semantic source citations retrieved for this prompt query.
          </span>
        </div>
      ) : (
          <div className='flex flex-col gap-3'>
          {sources.map((source, index) => {
            const isExpanded = expandedIndex === index
            const metadataEntries = Object.entries(source.metadata || {})

            return (
              <div
                key={`${source.chunkId}-${index}`}
                className={cn(
                  'flex flex-col rounded-xl border transition-all bg-background overflow-hidden',
                  isExpanded ? 'border-primary/40 shadow-xs' : 'border-border/80 hover:border-border'
                )}
              >
                <button
                  type='button'
                  onClick={() => toggleExpand(index)}
                  className='flex items-center justify-between p-3.5 text-left bg-secondary/10 hover:bg-secondary/20 transition-colors focus:outline-none w-full gap-2'
                >
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <FileText className='w-4 h-4 text-primary shrink-0' />
                    <span className='text-xs font-bold text-foreground truncate'>
                      {source.title || source.sourceId || `Source Chunk #${index + 1}`}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 shrink-0'>
                    <span className='px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20'>
                      Score: {source.score.toFixed(3)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
                    ) : (
                        <ChevronDown className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className='p-4 flex flex-col gap-3 border-t border-border/40 bg-background/40'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono bg-secondary/10 p-2.5 rounded-lg border border-border/40 text-muted-foreground'>
                      <div className='truncate'>
                        <span className='text-foreground font-sans font-bold block text-[9px]'>CHUNK ID</span>
                        <span className='truncate block font-medium'>{source.chunkId}</span>
                      </div>
                      <div className='truncate'>
                        <span className='text-foreground font-sans font-bold block text-[9px]'>DOC HASH</span>
                        <span className='truncate block font-medium flex items-center gap-0.5'>
                          <Hash className='w-2.5 h-2.5 text-primary shrink-0' />
                          {source.documentHash.substring(0, 16)}...
                        </span>
                      </div>
                    </div>

                    {metadataEntries.length > 0 && (
                      <div className='flex flex-col gap-1'>
                        <span className='text-[9px] font-bold uppercase tracking-wider text-muted-foreground'>
                          Attached Metadata
                        </span>
                        <div className='flex flex-wrap gap-1'>
                          {metadataEntries.map(([k, v]) => (
                            <span
                              key={k}
                              className='px-2 py-0.5 rounded-md bg-secondary/20 border border-border/60 text-[10px] font-mono text-muted-foreground'
                            >
                              <strong className='text-foreground font-sans font-bold'>{k}:</strong>{' '}
                              {String(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className='flex flex-col gap-1 pt-1'>
                      <span className='text-[9px] font-bold uppercase tracking-wider text-muted-foreground'>
                        Raw Chunk Text Preview
                      </span>
                      <div className='bg-background p-3 rounded-lg border border-border/60 text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto select-text shadow-inner'>
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
