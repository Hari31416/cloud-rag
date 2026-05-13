import { serve } from '@hono/node-server'

import { createApp } from './app/create-app'
import { RedisQueryCache } from './lib/cache'
import { createLogger } from './lib/logger'
import { BullMqQueueAdapter } from './lib/queue'
import { createRedisConnection } from './lib/redis'
import { startTelemetry } from './lib/telemetry'
import { loadConfig } from './config'

const config = loadConfig()
const telemetry = startTelemetry(config.OTEL_SERVICE_NAME)
const logger = createLogger()
const redis = createRedisConnection(config.REDIS_URL)

const queue = new BullMqQueueAdapter(redis, config.GATEWAY_QUEUE_NAME)
const cache = new RedisQueryCache(redis)
const app = createApp({
  config,
  queue,
  cache,
  logger,
})

const server = serve(
  {
    fetch: app.fetch,
    port: config.GATEWAY_PORT,
  },
  info => {
    logger.info(
      {
        port: info.port,
        queue: config.GATEWAY_QUEUE_NAME,
      },
      'gateway listening',
    )
  },
)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    try {
      server.close()
      await Promise.race([
        Promise.all([queue.close(), redis.quit(), telemetry?.shutdown()]),
        new Promise(resolve => setTimeout(resolve, 1000)),
      ])
    } catch (_) {}
    process.exit(0)
  })
}
