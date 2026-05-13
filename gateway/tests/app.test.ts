import assert from 'node:assert/strict'
import test from 'node:test'

import { createApp } from '../src/app/create-app'
import type {
  IngestJobEnvelope,
  QueryJobEnvelope,
  QueryResponse,
} from '../src/contracts'
import { buildCacheKey } from '../src/contracts'
import { loadConfig } from '../src/config'
import type { QueryCache } from '../src/lib/cache'
import type { QueueAdapter } from '../src/lib/queue'

class FakeQueue implements QueueAdapter {
  public ingestCalls = 0
  public queryCalls = 0

  async enqueueIngest(_envelope: IngestJobEnvelope, _jobId: string): Promise<string> {
    this.ingestCalls += 1
    return 'job-1'
  }

  async executeQuery(
    _envelope: QueryJobEnvelope,
    _jobId: string,
    _timeoutMs: number,
  ): Promise<QueryResponse> {
    this.queryCalls += 1
    return {
      answer: 'Answer from worker',
      cache: {
        hit: false,
        key: 'k1',
        similarity: null,
      },
      sources: [],
      retrieval: {
        topK: 5,
        tookMs: 12,
      },
      requestId: 'worker',
      traceId: 'worker-trace',
    }
  }

  async ping(): Promise<boolean> {
    return true
  }

  async close(): Promise<void> {}
}

class FakeCache implements QueryCache {
  private readonly values = new Map<string, QueryResponse>()

  async get(cacheKey: string): Promise<QueryResponse | null> {
    return this.values.get(cacheKey) ?? null
  }

  async set(cacheKey: string, value: QueryResponse, _ttlSeconds: number): Promise<void> {
    this.values.set(cacheKey, value)
  }

  async ping(): Promise<boolean> {
    return true
  }
}

const config = loadConfig({
  NODE_ENV: 'test',
  REDIS_URL: 'redis://localhost:6379/0',
  QDRANT_COLLECTION: 'test-collection',
})

function createTestApp(queue: FakeQueue, cache: FakeCache) {
  return createApp({
    config,
    queue,
    cache,
    logger: {
      info() {},
      error() {},
    },
  })
}

test('POST /api/v1/ingest returns 202 and enqueues work', async () => {
  const queue = new FakeQueue()
  const app = createTestApp(queue, new FakeCache())

  const response = await app.request('/api/v1/ingest', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Doc',
      content: 'CloudRAG text',
    }),
  })

  assert.equal(response.status, 202)
  assert.equal(queue.ingestCalls, 1)
  const payload = await response.json()
  assert.equal(payload.status, 'accepted')
  assert.equal(payload.queue, config.GATEWAY_QUEUE_NAME)
})

test('POST /api/v1/ingest rejects invalid payloads', async () => {
  const app = createTestApp(new FakeQueue(), new FakeCache())
  const response = await app.request('/api/v1/ingest', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      content: '',
    }),
  })

  assert.equal(response.status, 400)
  const payload = await response.json()
  assert.equal(payload.error.code, 'validation_error')
})

test('POST /api/v1/query serves exact cache hit without worker dispatch', async () => {
  const queue = new FakeQueue()
  const cache = new FakeCache()
  const cacheKey = buildCacheKey({
    prompt: 'What is CloudRAG?',
    topK: 5,
    minScore: 0.15,
    collectionName: config.QDRANT_COLLECTION,
    embeddingModel: config.EMBEDDING_MODEL,
    promptTemplateVersion: config.PROMPT_TEMPLATE_VERSION,
  })

  await cache.set(cacheKey, {
    answer: 'Cached answer',
    cache: {
      hit: true,
      key: cacheKey,
      similarity: 1,
    },
    sources: [],
    retrieval: {
      topK: 5,
      tookMs: 1,
    },
    requestId: 'cached',
    traceId: 'cached-trace',
  })

  const app = createTestApp(queue, cache)
  const response = await app.request('/api/v1/query', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'What is CloudRAG?',
    }),
  })

  assert.equal(response.status, 200)
  assert.equal(queue.queryCalls, 0)
  const payload = await response.json()
  assert.equal(payload.answer, 'Cached answer')
  assert.equal(payload.cache.hit, true)
})

test('POST /api/v1/query dispatches worker job on cache miss', async () => {
  const queue = new FakeQueue()
  const app = createTestApp(queue, new FakeCache())
  const response = await app.request('/api/v1/query', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'Explain retrieval',
      topK: 3,
      minScore: 0.2,
      useCache: true,
    }),
  })

  assert.equal(response.status, 200)
  assert.equal(queue.queryCalls, 1)
  const payload = await response.json()
  assert.equal(payload.answer, 'Answer from worker')
})

test('OPTIONS request returns valid CORS headers', async () => {
  const app = createTestApp(new FakeQueue(), new FakeCache())
  const response = await app.request('/api/v1/query', {
    method: 'OPTIONS',
    headers: {
      origin: 'http://localhost:5173',
      'access-control-request-method': 'POST',
    },
  })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true')
})

