import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, HelpCircle, Search, Sliders, Zap } from 'lucide-react'
import { z } from 'zod'
import type { QueryRequest } from '../lib/types'
import { cn } from '../lib/utils'

const querySchema = z.object({
  prompt: z.string().min(1, 'Prompt query string is strictly required'),
  topK: z.coerce.number().int().min(1).max(20),
  minScore: z.coerce.number().min(0).max(1),
  useCache: z.boolean(),
})

type QueryFormValues = z.infer<typeof querySchema>

interface QueryFormProps {
  onSubmitQuery: (payload: QueryRequest) => void
  onClearResult: () => void
  isPending: boolean
  submitError: Error | null
  hasResult: boolean
}

export function QueryForm({
  onSubmitQuery,
  onClearResult,
  isPending,
  submitError,
  hasResult,
}: QueryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<QueryFormValues>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      prompt: '',
      topK: 5,
      minScore: 0.15,
      useCache: true,
    },
  })

  const minScoreValue = watch('minScore')
  const topKValue = watch('topK')

  const onSubmit = (values: QueryFormValues) => {
    onSubmitQuery({
      prompt: values.prompt.trim(),
      topK: values.topK,
      minScore: values.minScore,
      useCache: values.useCache,
    })
  }

  const handleClearAll = () => {
    reset({
      prompt: '',
      topK: 5,
      minScore: 0.15,
      useCache: true,
    })
    onClearResult()
  }

  return (
    <div className='bg-secondary/10 rounded-xl border border-border p-5 flex flex-col gap-4'>
      <div>
        <h2 className='text-sm font-bold text-foreground flex items-center gap-1.5'>
          <Search className='w-4 h-4 text-primary' /> Semantic Query Workspace
        </h2>
        <p className='text-xs text-muted-foreground'>
          Retrieve top-K ranked chunks via semantic vectors and compute answers against available indices.
        </p>
      </div>

      {submitError && (
        <div className='p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-500'>
          <AlertCircle className='w-4 h-4 mt-0.5 shrink-0' />
          <div className='flex flex-col'>
            <span className='text-xs font-bold'>Query Execution Rejection</span>
            <span className='text-[11px] text-rose-400'>{submitError.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <label htmlFor='prompt' className='text-xs font-semibold text-foreground flex items-center gap-1'>
            Prompt Query <span className='text-rose-500'>*</span>
          </label>
          <textarea
            id='prompt'
            {...register('prompt')}
            rows={3}
            placeholder='e.g. How does CloudRAG ingest data and preserve absolute cloud agnosticism?'
            className={cn(
              'bg-background border rounded-lg p-3 text-xs focus:outline-none text-foreground resize-y',
              errors.prompt ? 'border-rose-500 focus:border-rose-500' : 'border-border focus:border-primary',
            )}
          />
          {errors.prompt && (
            <span className='text-[11px] text-rose-500 font-medium'>{errors.prompt.message}</span>
          )}
        </div>

        <div className='grid grid-cols-2 gap-4 pt-2 border-t border-border/60'>
          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center justify-between'>
              <label htmlFor='topK' className='text-xs font-semibold text-foreground flex items-center gap-1'>
                <Sliders className='w-3 h-3 text-primary' /> Top-K Chunks
              </label>
              <span className='text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded'>
                {topKValue}
              </span>
            </div>
            <input
              id='topK'
              type='range'
              min={1}
              max={20}
              step={1}
              {...register('topK')}
              className='accent-primary cursor-pointer'
            />
            <div className='flex justify-between text-[10px] text-muted-foreground font-mono'>
              <span>1</span>
              <span>20</span>
            </div>
            {errors.topK && (
              <span className='text-[11px] text-rose-500 font-medium'>{errors.topK.message}</span>
            )}
          </div>

          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center justify-between'>
              <label
                htmlFor='minScore'
                className='text-xs font-semibold text-foreground flex items-center gap-1'
              >
                <HelpCircle className='w-3 h-3 text-emerald-400' /> Minimum Similarity
              </label>
              <span className='text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded'>
                {minScoreValue}
              </span>
            </div>
            <input
              id='minScore'
              type='range'
              min={0}
              max={1}
              step={0.01}
              {...register('minScore')}
              className='accent-emerald-400 cursor-pointer'
            />
            <div className='flex justify-between text-[10px] text-muted-foreground font-mono'>
              <span>0.0</span>
              <span>1.0</span>
            </div>
            {errors.minScore && (
              <span className='text-[11px] text-rose-500 font-medium'>{errors.minScore.message}</span>
            )}
          </div>
        </div>

        <div className='flex items-center justify-between pt-1'>
          <label htmlFor='useCache' className='flex items-center gap-2 cursor-pointer select-none'>
            <input
              id='useCache'
              type='checkbox'
              {...register('useCache')}
              className='w-4 h-4 rounded accent-primary cursor-pointer bg-background border-border'
            />
            <span className='text-xs font-medium text-foreground flex items-center gap-1'>
              <Zap className='w-3.5 h-3.5 text-amber-400 fill-amber-400/20' /> Utilize Semantic Redis Cache
            </span>
          </label>
        </div>

        <div className='flex items-center justify-end gap-2 pt-2 border-t border-border/60'>
          {(hasResult || watch('prompt').length > 0) && (
            <button
              type='button'
              onClick={handleClearAll}
              disabled={isPending}
              className='px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50'
            >
              Clear Workspace
            </button>
          )}

          <button
            type='submit'
            disabled={isPending}
            className='px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-primary/20'
          >
            {isPending ? (
              <>
                <span className='w-3 h-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin' />
                Querying Gateway...
              </>
            ) : (
              'Dispatch Query Pipeline'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
