import { randomBytes, randomUUID } from 'node:crypto'

import type { MiddlewareHandler } from 'hono'

export type AppVariables = {
  requestId: string
  traceId: string
}

function createTraceId(): string {
  return randomBytes(16).toString('hex')
}

function createTraceParent(traceId: string): string {
  return `00-${traceId}-${randomBytes(8).toString('hex')}-01`
}

export const requestContextMiddleware: MiddlewareHandler<{ Variables: AppVariables }> = async (
  c,
  next,
) => {
  const requestId = c.req.header('x-request-id') ?? randomUUID()
  const incomingTraceParent = c.req.header('traceparent')
  const traceId = incomingTraceParent?.split('-')[1] ?? createTraceId()

  c.set('requestId', requestId)
  c.set('traceId', traceId)
  c.header('x-request-id', requestId)
  c.header('x-trace-id', traceId)
  c.header('traceparent', incomingTraceParent ?? createTraceParent(traceId))

  await next()
}
