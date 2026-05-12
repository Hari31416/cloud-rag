import { z } from 'zod'

import { defaultEmbeddingModel, promptTemplateVersion, queueName } from './contracts'

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  GATEWAY_PORT: z.coerce.number().int().positive().default(3000),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379/0'),
  REDIS_PASSWORD: z.string().optional(),
  GATEWAY_QUEUE_NAME: z.string().min(1).default(queueName),
  GATEWAY_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  QDRANT_COLLECTION: z.string().min(1).default('cloudrag-documents'),
  EMBEDDING_MODEL: z.string().min(1).default(defaultEmbeddingModel),
  PROMPT_TEMPLATE_VERSION: z.string().min(1).default(promptTemplateVersion),
  OTEL_SERVICE_NAME: z.string().min(1).default('cloudrag-gateway'),
  OTEL_SDK_DISABLED: z.string().optional(),
})

export type GatewayConfig = ReturnType<typeof loadConfig>

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  return configSchema.parse(env)
}
