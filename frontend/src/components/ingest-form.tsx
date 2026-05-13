import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useIngestDocument } from '../hooks/use-ingest-document'
import type { IngestAcceptedResponse, LocalIngestEntry } from '../lib/types'
import { cn } from '../lib/utils'

const ingestSchema = z.object({
  sourceId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1, 'Plain text content is strictly required'),
  metadataRows: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .refine(
      (rows) => {
        const keys = rows.map((r) => r.key.trim()).filter(Boolean)
        return new Set(keys).size === keys.length
      },
      { message: 'Metadata keys must be absolutely unique' },
    ),
})

type IngestFormValues = z.infer<typeof ingestSchema>

interface IngestFormProps {
  onSuccessIngest: (entry: LocalIngestEntry) => void
}

export function IngestForm({ onSuccessIngest }: IngestFormProps) {
  const { mutate, isPending, error: submitError } = useIngestDocument()
  const [successResponse, setSuccessResponse] = useState<IngestAcceptedResponse | null>(null)
  const [showTraceDetails, setShowTraceDetails] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IngestFormValues>({
    resolver: zodResolver(ingestSchema),
    defaultValues: {
      sourceId: '',
      title: '',
      content: '',
      metadataRows: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'metadataRows',
  })

  const onSubmit = (values: IngestFormValues) => {
    setSuccessResponse(null)
    const metadataObj: Record<string, string> = {}
    for (const row of values.metadataRows) {
      const trimmedKey = row.key.trim()
      if (trimmedKey) {
        metadataObj[trimmedKey] = row.value.trim()
      }
    }

    mutate(
      {
        sourceId: values.sourceId?.trim() || undefined,
        title: values.title?.trim() || undefined,
        content: values.content,
        contentType: 'text/plain',
        metadata: metadataObj,
      },
      {
        onSuccess: (data) => {
          setSuccessResponse(data)
          const entry: LocalIngestEntry = {
            submittedAt: new Date().toISOString(),
            title: values.title?.trim() || undefined,
            sourceId: data.sourceId,
            taskId: data.taskId,
            documentHash: data.documentHash,
            requestId: data.requestId,
            traceId: data.traceId,
          }
          onSuccessIngest(entry)
          reset({
            sourceId: '',
            title: '',
            content: '',
            metadataRows: [],
          })
        },
      },
    )
  }

  const handleClear = () => {
    reset({
      sourceId: '',
      title: '',
      content: '',
      metadataRows: [],
    })
    setSuccessResponse(null)
  }

  return (
    <div className='bg-secondary/10 rounded-xl border border-border p-5 flex flex-col gap-4'>
      <div>
        <h2 className='text-sm font-bold text-foreground'>Document Ingestion Workspace</h2>
        <p className='text-xs text-muted-foreground'>
          Ingest raw text artifacts asynchronously into the CloudRAG vector ingestion pipeline.
        </p>
      </div>

      {successResponse && (
        <div className='p-4 rounded-lg bg-primary/10 border border-primary/30 flex flex-col gap-2'>
          <div className='flex items-center gap-2 text-primary'>
            <CheckCircle2 className='w-4 h-4' />
            <span className='text-xs font-bold'>Ingestion Payload Accepted Successfully</span>
          </div>

          <div className='grid grid-cols-2 gap-2 text-xs font-mono bg-background/60 p-2.5 rounded border border-border/50'>
            <div>
              <span className='text-[10px] text-muted-foreground block'>TASK ID</span>
              <span className='text-foreground font-semibold truncate block'>
                {successResponse.taskId}
              </span>
            </div>
            <div>
              <span className='text-[10px] text-muted-foreground block'>DOCUMENT HASH</span>
              <span className='text-foreground font-semibold truncate block'>
                {successResponse.documentHash}
              </span>
            </div>
          </div>

          <button
            type='button'
            onClick={() => setShowTraceDetails(!showTraceDetails)}
            className='flex items-center gap-1 text-[11px] text-primary hover:underline self-start font-medium mt-1'
          >
            {showTraceDetails ? <ChevronUp className='w-3 h-3' /> : <ChevronDown className='w-3 h-3' />}
            {showTraceDetails ? 'Hide Request / Trace Envelopes' : 'View Request / Trace Envelopes'}
          </button>

          {showTraceDetails && (
            <div className='flex flex-col gap-1 text-[11px] font-mono text-muted-foreground bg-background/40 p-2 rounded border border-border/40 mt-1'>
              <div>
                <strong className='text-foreground text-[10px]'>Request ID:</strong>{' '}
                {successResponse.requestId}
              </div>
              <div>
                <strong className='text-foreground text-[10px]'>Trace ID:</strong>{' '}
                {successResponse.traceId}
              </div>
              <div>
                <strong className='text-foreground text-[10px]'>Queue Boundary:</strong>{' '}
                {successResponse.queue}
              </div>
            </div>
          )}
        </div>
      )}

      {submitError && (
        <div className='p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-500'>
          <AlertCircle className='w-4 h-4 mt-0.5 shrink-0' />
          <div className='flex flex-col'>
            <span className='text-xs font-bold'>Ingestion Mutate Rejection</span>
            <span className='text-[11px] text-rose-400'>{submitError.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-1'>
            <label htmlFor='sourceId' className='text-xs font-semibold text-foreground'>
              Source ID <span className='text-[10px] text-muted-foreground font-normal'>(Optional)</span>
            </label>
            <input
              id='sourceId'
              type='text'
              {...register('sourceId')}
              placeholder='e.g. document-guid-1'
              className='bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground'
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label htmlFor='title' className='text-xs font-semibold text-foreground'>
              Document Title <span className='text-[10px] text-muted-foreground font-normal'>(Optional)</span>
            </label>
            <input
              id='title'
              type='text'
              {...register('title')}
              placeholder='e.g. System Architecture Plan'
              className='bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground'
            />
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <label htmlFor='content' className='text-xs font-semibold text-foreground'>
              Content <span className='text-rose-500'>*</span>
            </label>
            <span className='text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded'>
              text/plain
            </span>
          </div>
          <textarea
            id='content'
            {...register('content')}
            rows={5}
            placeholder='Paste plain text document content here to process chunks and generate semantic vectors...'
            className={cn(
              'bg-background border rounded-lg p-3 text-xs focus:outline-none text-foreground font-mono resize-y',
              errors.content ? 'border-rose-500 focus:border-rose-500' : 'border-border focus:border-primary',
            )}
          />
          {errors.content && (
            <span className='text-[11px] text-rose-500 font-medium'>{errors.content.message}</span>
          )}
        </div>

        <div className='flex flex-col gap-2 pt-2 border-t border-border/60'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-foreground'>Custom Metadata Attributes</span>
            <button
              type='button'
              onClick={() => append({ key: '', value: '' })}
              className='flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2.5 py-1 rounded-md border border-border transition-colors'
            >
              <Plus className='w-3 h-3' /> Add Metadata Row
            </button>
          </div>

          {errors.metadataRows?.root && (
            <span className='text-[11px] text-rose-500 font-medium block'>
              {errors.metadataRows.root.message}
            </span>
          )}

          {fields.length === 0 ? (
            <span className='text-[11px] text-muted-foreground italic bg-background/30 p-2 rounded text-center border border-dashed border-border'>
              No custom attributes assigned. Click &apos;Add Metadata Row&apos; to attach custom dimensions.
            </span>
          ) : (
            <div className='flex flex-col gap-2'>
              {fields.map((field, index) => (
                <div key={field.id} className='flex items-center gap-2'>
                  <input
                    type='text'
                    {...register(`metadataRows.${index}.key`)}
                    placeholder='Key (e.g. team)'
                    className='bg-background border border-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-primary text-foreground flex-1'
                  />
                  <input
                    type='text'
                    {...register(`metadataRows.${index}.value`)}
                    placeholder='Value (e.g. search)'
                    className='bg-background border border-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-primary text-foreground flex-1'
                  />
                  <button
                    type='button'
                    onClick={() => remove(index)}
                    className='p-1.5 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors'
                    title='Remove row'
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='flex items-center justify-end gap-2 pt-2'>
          <button
            type='button'
            onClick={handleClear}
            disabled={isPending}
            className='px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50'
          >
            Clear Form
          </button>
          <button
            type='submit'
            disabled={isPending}
            className='px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-primary/20'
          >
            {isPending ? (
              <>
                <span className='w-3 h-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin' />
                Dispatching Task...
              </>
            ) : (
              'Submit Ingestion Request'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
