import { createHash } from 'node:crypto'

import { z } from 'zod'

export const contractVersion = 'v1' as const
export const queueName = 'cloudrag-jobs'
export const promptTemplateVersion = '2026-05-12'
export const defaultEmbeddingModel = 'deterministic-hash-v1'

export const sourceMetadataSchema = z.record(z.string(), z.string()).default({})

export const ingestRequestSchema = z.object({
  sourceId: z.string().min(1).max(128).optional(),
  title: z.string().min(1).max(256).optional(),
  content: z.string().min(1),
  contentType: z.string().min(1).default('text/plain'),
  metadata: sourceMetadataSchema,
})

export type IngestRequest = z.infer<typeof ingestRequestSchema>

export const queryRequestSchema = z.object({
  prompt: z.string().min(1),
  topK: z.number().int().min(1).max(20).default(5),
  minScore: z.number().min(0).max(1).default(0.15),
  useCache: z.boolean().default(true),
})

export type QueryRequest = z.infer<typeof queryRequestSchema>

export const sourceReferenceSchema = z.object({
  sourceId: z.string(),
  chunkId: z.string(),
  documentHash: z.string(),
  score: z.number(),
  content: z.string(),
  title: z.string().nullable(),
  metadata: sourceMetadataSchema,
})

export const queryResponseSchema = z.object({
  answer: z.string(),
  cache: z.object({
    hit: z.boolean(),
    key: z.string(),
    similarity: z.number().nullable(),
  }),
  sources: z.array(sourceReferenceSchema),
  retrieval: z.object({
    topK: z.number().int(),
    tookMs: z.number().int(),
  }),
  requestId: z.string(),
  traceId: z.string(),
})

export type QueryResponse = z.infer<typeof queryResponseSchema>

export const ingestAcceptedResponseSchema = z.object({
  status: z.literal('accepted'),
  taskId: z.string(),
  sourceId: z.string(),
  documentHash: z.string(),
  queue: z.string(),
  requestId: z.string(),
  traceId: z.string(),
})

export type IngestAcceptedResponse = z.infer<typeof ingestAcceptedResponseSchema>

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  requestId: z.string(),
  traceId: z.string(),
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>

export const ingestJobPayloadSchema = ingestRequestSchema.extend({
  storage: z
    .object({
      kind: z.enum(['inline', 's3']),
      objectKey: z.string().optional(),
      bucket: z.string().optional(),
    })
    .default({ kind: 'inline' }),
  submittedAt: z.string().datetime(),
})

export const queryJobPayloadSchema = queryRequestSchema.extend({
  cacheKey: z.string(),
  collectionName: z.string(),
  embeddingModel: z.string(),
  promptTemplateVersion: z.string(),
  submittedAt: z.string().datetime(),
})

export const jobEnvelopeSchema = z.discriminatedUnion('jobName', [
  z.object({
    version: z.literal(contractVersion),
    jobName: z.literal('ingest.v1'),
    requestId: z.string(),
    traceId: z.string(),
    payload: ingestJobPayloadSchema,
  }),
  z.object({
    version: z.literal(contractVersion),
    jobName: z.literal('query.v1'),
    requestId: z.string(),
    traceId: z.string(),
    payload: queryJobPayloadSchema,
  }),
])

export type IngestJobEnvelope = Extract<
  z.infer<typeof jobEnvelopeSchema>,
  { jobName: 'ingest.v1' }
>
export type QueryJobEnvelope = Extract<
  z.infer<typeof jobEnvelopeSchema>,
  { jobName: 'query.v1' }
>

export const workerQueryResultSchema = queryResponseSchema.extend({
  requestId: z.string(),
  traceId: z.string(),
})

export type WorkerQueryResult = z.infer<typeof workerQueryResultSchema>

export function computeDocumentHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

export function buildCacheKey(input: {
  prompt: string
  topK: number
  minScore: number
  collectionName: string
  embeddingModel?: string
  promptTemplateVersion?: string
}): string {
  const normalizedPrompt = input.prompt.trim().replace(/\s+/g, ' ')
  const material = [
    'semantic-cache',
    contractVersion,
    normalizedPrompt,
    String(input.topK),
    input.minScore.toFixed(4),
    input.collectionName,
    input.embeddingModel ?? defaultEmbeddingModel,
    input.promptTemplateVersion ?? promptTemplateVersion,
  ].join('|')

  return `semantic-cache:${contractVersion}:${createHash('sha256').update(material).digest('hex')}`
}
