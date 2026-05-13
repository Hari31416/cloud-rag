import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Cpu, Sparkles, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { QueryResponse } from '../lib/types'

interface QueryResultProps {
  result: QueryResponse
}

export function QueryResult({ result }: QueryResultProps) {
  const [showMetadata, setShowMetadata] = useState(false)

  return (
    <div className='flex flex-col gap-4 p-5 rounded-2xl bg-secondary/10 border border-primary/20 shadow-sm relative overflow-hidden glow-card w-full animate-fadeIn mt-2'>
      {/* Decorative gradient orb */}
      <div className='absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none' />

      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5 z-10'>
        <div className='flex items-center gap-2.5'>
          <div className='p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0'>
            <Sparkles className='w-4 h-4' />
          </div>
          <div>
            <h3 className='text-xs font-bold uppercase tracking-wider text-foreground'>
              Synthesized Answer
            </h3>
            <span className='text-[10px] text-muted-foreground block font-medium'>
              Generated asynchronously via top-ranked semantic chunks
            </span>
          </div>
        </div>

        <div className='flex items-center gap-1.5 self-start sm:self-auto'>
          {result.cache.hit ? (
            <span className='px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 shrink-0 shadow-xs'>
              <Zap className='w-3 h-3 fill-amber-500 shrink-0' /> Cache Hit
              {result.cache.similarity !== null && ` (${(result.cache.similarity * 100).toFixed(0)}%)`}
            </span>
          ) : (
            <span className='px-2.5 py-1 rounded-full text-[10px] font-bold bg-background text-muted-foreground border border-border flex items-center gap-1 shrink-0 shadow-xs'>
              <Cpu className='w-3 h-3 shrink-0' /> Cache Miss
            </span>
          )}

          <span className='px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-muted-foreground bg-background border border-border flex items-center gap-1 shrink-0 shadow-xs'>
            <Clock className='w-3 h-3 text-primary shrink-0' /> {result.retrieval.tookMs}ms
          </span>
        </div>
      </div>

      <div className='text-xs sm:text-sm text-foreground leading-relaxed font-medium bg-background/50 p-4 rounded-xl border border-border/60 shadow-xs z-10 overflow-x-auto'>
        {result.answer ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              p: ({ node, ...props }) => <p className='my-2 leading-relaxed' {...props} />,
              h1: ({ node, ...props }) => <h1 className='text-lg font-extrabold mt-4 mb-2 text-foreground' {...props} />,
              h2: ({ node, ...props }) => <h2 className='text-base font-bold mt-4 mb-2 text-foreground' {...props} />,
              h3: ({ node, ...props }) => <h3 className='text-sm font-bold mt-3 mb-1.5 text-foreground' {...props} />,
              h4: ({ node, ...props }) => <h4 className='text-sm font-bold mt-3 mb-1.5 text-foreground' {...props} />,
              ul: ({ node, ...props }) => <ul className='list-disc pl-5 my-2.5 flex flex-col gap-1 marker:text-primary' {...props} />,
              ol: ({ node, ...props }) => <ol className='list-decimal pl-5 my-2.5 flex flex-col gap-1 marker:text-primary' {...props} />,
              li: ({ node, ...props }) => <li className='pl-0.5' {...props} />,
              a: ({ node, ...props }) => <a className='text-primary hover:underline font-semibold' {...props} />,
              strong: ({ node, ...props }) => <strong className='font-bold text-foreground' {...props} />,
              table: ({ node, ...props }) => (
                <div className='w-full overflow-x-auto my-3 rounded-lg border border-border/80 bg-background/40'>
                  <table className='w-full text-left border-collapse text-xs' {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => <thead className='bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/80' {...props} />,
              tbody: ({ node, ...props }) => <tbody className='divide-y divide-border/40' {...props} />,
              tr: ({ node, ...props }) => <tr className='hover:bg-secondary/10 transition-colors' {...props} />,
              th: ({ node, ...props }) => <th className='p-2.5 font-bold font-sans text-foreground' {...props} />,
              td: ({ node, ...props }) => <td className='p-2.5 align-top font-sans text-muted-foreground' {...props} />,
              code: ({ node, className, children, ...props }) => {
                const isBlock = String(children).includes('\n')
                if (isBlock) {
                  return (
                    <div className='my-2 rounded-lg bg-background border border-border/80 overflow-x-auto p-3 font-mono text-xs text-muted-foreground shadow-inner'>
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </div>
                  )
                }
                return (
                  <code className='bg-background px-1.5 py-0.5 rounded border border-border/60 font-mono text-[11px] text-primary font-semibold' {...props}>
                    {children}
                  </code>
                )
              },
            }}
          >
            {result.answer}
          </ReactMarkdown>
        ) : (
          <span className='text-muted-foreground italic'>
            Empty response payload returned by gateway engine.
          </span>
        )}
      </div>

      <div className='flex flex-col gap-1 pt-1 z-10'>
        <button
          type='button'
          onClick={() => setShowMetadata(!showMetadata)}
          className='flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary self-start font-bold transition-colors focus:outline-none'
        >
          {showMetadata ? <ChevronUp className='w-3 h-3' /> : <ChevronDown className='w-3 h-3' />}
          {showMetadata ? 'Hide Envelopes & Routing Telemetry' : 'Inspect Envelopes & Routing Telemetry'}
        </button>

        {showMetadata && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono bg-background p-3 rounded-xl border border-border/80 mt-1.5 text-muted-foreground shadow-xs animate-fadeIn'>
            <div className='truncate'>
              <span className='text-foreground font-sans font-bold block text-[9px]'>REQUEST ID</span>
              <span className='truncate block font-medium'>{result.requestId}</span>
            </div>
            <div className='truncate'>
              <span className='text-foreground font-sans font-bold block text-[9px]'>TRACE ID</span>
              <span className='truncate block font-medium'>{result.traceId}</span>
            </div>
            <div className='col-span-1 sm:col-span-2 truncate pt-1.5 border-t border-border/40'>
              <span className='text-foreground font-sans font-bold block text-[9px]'>CACHE KEY</span>
              <span className='truncate block text-[9px] font-medium text-muted-foreground/80'>
                {result.cache.key || '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
