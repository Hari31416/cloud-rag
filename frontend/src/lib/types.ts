export interface IngestRequest {
  sourceId?: string
  title?: string
  content: string
  contentType: 'text/plain'
  metadata: Record<string, string>
}

export interface IngestAcceptedResponse {
  status: 'accepted'
  taskId: string
  sourceId: string
  documentHash: string
  queue: string
  requestId: string
  traceId: string
}

export interface QueryRequest {
  prompt: string
  topK: number
  minScore: number
  useCache: boolean
}

export interface SourceReference {
  sourceId: string
  chunkId: string
  documentHash: string
  score: number
  content: string
  title?: string
  metadata: Record<string, unknown>
}

export interface QueryResponse {
  answer: string
  cache: {
    hit: boolean
    key: string
    similarity: number | null
  }
  sources: SourceReference[]
  retrieval: {
    topK: number
    tookMs: number
  }
  requestId: string
  traceId: string
}

export interface HealthResponse {
  status: string
  timestamp?: string
  version?: string
}

export interface ReadyResponse {
  status: string
  redis: string
  vectorDb: string
  storage: string
}

export interface ApiErrorResponse {
  error: string
  code?: string
  details?: unknown
}

export interface LocalIngestEntry {
  submittedAt: string
  title?: string
  sourceId: string
  taskId: string
  documentHash: string
  requestId: string
  traceId: string
}
