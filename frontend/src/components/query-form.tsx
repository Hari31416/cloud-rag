import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, HelpCircle, Sliders, Zap, Send, Settings, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [showAdvanced, setShowAdvanced] = useState(false)

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
  const promptValue = watch('prompt')

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
    <div className='flex flex-col items-center w-full animate-fadeIn'>
      {/* Central Premium Header mirroring Image 2 */}
      <div className='flex flex-col items-center text-center gap-2 mb-8 mt-2'>
        <h1 className='text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent'>
          Welcome to CloudRAG AI
        </h1>
        <p className='text-xs lg:text-sm text-muted-foreground max-w-lg font-medium'>
          Agentic AI Platform for Transforming Unstructured Data into Actionable Intelligence
        </p>
      </div>

      {submitError && (
        <div className='w-full max-w-3xl p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-500'>
          <AlertCircle className='w-4 h-4 mt-0.5 shrink-0' />
          <div className='flex flex-col'>
            <span className='text-xs font-bold'>Query Execution Rejection</span>
            <span className='text-[11px] text-rose-400'>{submitError.message}</span>
          </div>
        </div>
      )}

      {/* Main Elevated Search Container mirroring AskAtlas input box */}
      <form onSubmit={handleSubmit(onSubmit)} className='w-full max-w-3xl flex flex-col gap-3'>
        <div
          className={cn(
            'flex flex-col bg-background rounded-2xl border border-border/80 shadow-md hover:shadow-lg hover:border-primary/40 transition-all p-3.5 relative',
            errors.prompt ? 'border-rose-500 hover:border-rose-500' : ''
          )}
        >
          <textarea
            id='prompt'
            {...register('prompt')}
            rows={3}
            placeholder='e.g. How does CloudRAG ingest data and preserve absolute cloud agnosticism?'
            className='w-full bg-transparent border-none text-xs lg:text-sm focus:outline-none text-foreground resize-none p-1 placeholder:text-muted-foreground/70 font-medium'
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(onSubmit)()
              }
            }}
          />

          {/* Bottom Bar inside the search container */}
          <div className='flex items-center justify-between pt-3 border-t border-border/40 mt-1'>
            {/* Left side settings reveal button resembling 'All Documents' icon */}
            <button
              type='button'
              onClick={() => setShowAdvanced(!showAdvanced)}
              className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors focus:outline-none'
            >
              <Settings className='w-3.5 h-3.5 text-primary' />
              <span>Extra Config</span>
              {showAdvanced ? (
                <ChevronUp className='w-3 h-3 ml-0.5' />
              ) : (
                <ChevronDown className='w-3 h-3 ml-0.5' />
              )}
            </button>

            {/* Right side actions */}
            <div className='flex items-center gap-2'>
              {(hasResult || promptValue.length > 0) && (
                <button
                  type='button'
                  onClick={handleClearAll}
                  disabled={isPending}
                  className='px-2.5 py-1 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors disabled:opacity-50'
                >
                  Clear
                </button>
              )}

              <button
                type='submit'
                disabled={isPending}
                className='flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm'
                title='Dispatch Query Pipeline'
              >
                {isPending ? (
                  <span className='w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin' />
                ) : (
                  <Send className='w-3.5 h-3.5 shrink-0' />
                )}
                <span className='sr-only'>Dispatch Query Pipeline</span>
              </button>
            </div>
          </div>
        </div>

        {errors.prompt && (
          <span className='text-[11px] text-rose-500 font-medium px-2'>
            {errors.prompt.message}
          </span>
        )}

        {/* Expandable Advanced Options Tray */}
        {showAdvanced && (
          <div className='flex flex-col gap-4 p-4 rounded-xl bg-secondary/10 border border-border animate-fadeIn mt-1'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground block'>
              Retrieval Strategy Hyperparameters
            </span>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Top-K Slider */}
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

              {/* Min Score Slider */}
              <div className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between'>
                  <label
                    htmlFor='minScore'
                    className='text-xs font-semibold text-foreground flex items-center gap-1'
                  >
                    <HelpCircle className='w-3 h-3 text-emerald-500' /> Minimum Similarity
                  </label>
                  <span className='text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded'>
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
                  className='accent-emerald-500 cursor-pointer'
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

            {/* Semantic Cache Toggle */}
            <div className='pt-2 border-t border-border/40 flex items-center justify-between'>
              <label htmlFor='useCache' className='flex items-center gap-2 cursor-pointer select-none'>
                <input
                  id='useCache'
                  type='checkbox'
                  {...register('useCache')}
                  className='w-4 h-4 rounded accent-primary cursor-pointer bg-background border-border'
                />
                <span className='text-xs font-medium text-foreground flex items-center gap-1.5'>
                  <Zap className='w-3.5 h-3.5 text-amber-500 fill-amber-500/20' /> Utilize Semantic Redis Cache
                </span>
              </label>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
