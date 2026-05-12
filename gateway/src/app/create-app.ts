import { randomUUID } from 'node:crypto'

import { Hono } from 'hono'
import { ZodError } from 'zod'

import {
  buildCacheKey,
  computeDocumentHash,
  contractVersion,
  errorResponseSchema,
  ingestAcceptedResponseSchema,
  ingestRequestSchema,
  queryRequestSchema,
  queryResponseSchema,
} from '../contracts'
import type { GatewayConfig } from '../config'
import { AppError, isAppError } from '../lib/errors'
import type { AppVariables } from '../lib/request-context'
import { requestContextMiddleware } from '../lib/request-context'
import type { QueryCache } from '../lib/cache'
import type { QueueAdapter } from '../lib/queue'

export interface AppDependencies {
  config: GatewayConfig
  queue: QueueAdapter
  cache: QueryCache
  logger: {
    info: (payload: Record<string, unknown>, message?: string) => void
    error: (payload: Record<string, unknown>, message?: string) => void
  }
}

export function createApp(deps: AppDependencies) {
  const app = new Hono<{ Variables: AppVariables }>()
  app.use('*', requestContextMiddleware)

  app.get('/health', c => {
    return c.json({
      status: 'ok',
      service: 'cloudrag-gateway',
    })
  })

  app.get('/ready', async c => {
    const redisReady = await deps.queue.ping()
    const cacheReady = await deps.cache.ping()
    const status = redisReady && cacheReady ? 'ready' : 'degraded'

    return c.json(
      {
        status,
        dependencies: {
          queue: redisReady ? 'ready' : 'down',
          cache: cacheReady ? 'ready' : 'down',
        },
      },
      status === 'ready' ? 200 : 503,
    )
  })

  app.post('/api/v1/ingest', async c => {
    const requestId = c.get('requestId')
    const traceId = c.get('traceId')
    const body = ingestRequestSchema.parse(await c.req.json())
    const sourceId = body.sourceId ?? `src_${randomUUID()}`
    const documentHash = computeDocumentHash(body.content)
    const jobId = `${sourceId}:${documentHash}`

    const taskId = await deps.queue.enqueueIngest(
      {
        version: contractVersion,
        jobName: 'ingest.v1',
        requestId,
        traceId,
        payload: {
          ...body,
          sourceId,
          storage: {
            kind: 'inline',
          },
          submittedAt: new Date().toISOString(),
        },
      },
      jobId,
    )

    deps.logger.info(
      {
        requestId,
        traceId,
        taskId,
        sourceId,
        documentHash,
      },
      'ingest accepted',
    )

    return c.json(
      ingestAcceptedResponseSchema.parse({
        status: 'accepted',
        taskId,
        sourceId,
        documentHash,
        queue: deps.config.GATEWAY_QUEUE_NAME,
        requestId,
        traceId,
      }),
      202,
    )
  })

  app.post('/api/v1/query', async c => {
    const requestId = c.get('requestId')
    const traceId = c.get('traceId')
    const body = queryRequestSchema.parse(await c.req.json())
    const cacheKey = buildCacheKey({
      prompt: body.prompt,
      topK: body.topK,
      minScore: body.minScore,
      collectionName: deps.config.QDRANT_COLLECTION,
      embeddingModel: deps.config.EMBEDDING_MODEL,
      promptTemplateVersion: deps.config.PROMPT_TEMPLATE_VERSION,
    })

    if (body.useCache) {
      const cached = await deps.cache.get(cacheKey)
      if (cached) {
        return c.json(
          queryResponseSchema.parse({
            ...cached,
            cache: {
              ...cached.cache,
              hit: true,
            },
            requestId,
            traceId,
          }),
        )
      }
    }

    const result = await deps.queue.executeQuery(
      {
        version: contractVersion,
        jobName: 'query.v1',
        requestId,
        traceId,
        payload: {
          ...body,
          cacheKey,
          collectionName: deps.config.QDRANT_COLLECTION,
          embeddingModel: deps.config.EMBEDDING_MODEL,
          promptTemplateVersion: deps.config.PROMPT_TEMPLATE_VERSION,
          submittedAt: new Date().toISOString(),
        },
      },
      `${requestId}:query`,
      deps.config.GATEWAY_QUERY_TIMEOUT_MS,
    )

    const response = queryResponseSchema.parse({
      ...result,
      requestId,
      traceId,
    })

    if (!response.cache.hit) {
      await deps.cache.set(cacheKey, response, 600)
    }

    return c.json(response)
  })

  app.onError((error, c) => {
    const requestId = c.get('requestId')
    const traceId = c.get('traceId')

    if (error instanceof ZodError) {
      return c.json(
        errorResponseSchema.parse({
          error: {
            code: 'validation_error',
            message: 'Request validation failed',
            details: error.flatten(),
          },
          requestId,
          traceId,
        }),
        400,
      )
    }

    if (isAppError(error)) {
      return c.json(
        errorResponseSchema.parse({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          requestId,
          traceId,
        }),
        { status: error.status as 400 },
      )
    }

    deps.logger.error(
      {
        error,
        requestId,
        traceId,
      },
      'unhandled gateway error',
    )

    return c.json(
      errorResponseSchema.parse({
        error: {
          code: 'internal_error',
          message: 'Internal server error',
        },
        requestId,
        traceId,
      }),
      500,
    )
  })

  return app
}
