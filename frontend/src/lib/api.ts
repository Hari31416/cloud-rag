import { getApiBaseUrl } from './env'
import type {
  HealthResponse,
  IngestAcceptedResponse,
  IngestRequest,
  QueryRequest,
  QueryResponse,
  ReadyResponse,
} from './types'

export class ApiError extends Error {
  public status: number
  public details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`

  const headers = new Headers(options.headers)
  if (!headers.has('content-type') && options.body && typeof options.body === 'string') {
    headers.set('content-type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(url, { ...options, headers })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network failure'
    throw new ApiError(`Failed to fetch: ${msg}`, 0)
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`
    let details: unknown
    try {
      const errorData = (await response.json()) as { error?: string; details?: unknown }
      if (errorData.error) {
        errorMsg = errorData.error
      }
      details = errorData.details
    } catch {
      // ignore JSON parse error for error payload
    }
    throw new ApiError(errorMsg, response.status, details)
  }

  return (await response.json()) as T
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('health')
}

export async function getReady(): Promise<ReadyResponse> {
  return request<ReadyResponse>('ready')
}

export async function postIngest(payload: IngestRequest): Promise<IngestAcceptedResponse> {
  return request<IngestAcceptedResponse>('api/v1/ingest', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function postQuery(payload: QueryRequest): Promise<QueryResponse> {
  return request<QueryResponse>('api/v1/query', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
