import type IORedis from 'ioredis'

import type { QueryResponse } from '../contracts'

export interface QueryCache {
  get(cacheKey: string): Promise<QueryResponse | null>
  set(cacheKey: string, value: QueryResponse, ttlSeconds: number): Promise<void>
  ping(): Promise<boolean>
}

export class RedisQueryCache implements QueryCache {
  constructor(
    private readonly redis: IORedis,
    private readonly namespace = 'cloudrag:query-cache',
  ) {}

  async get(cacheKey: string): Promise<QueryResponse | null> {
    const value = await this.redis.get(this.toRedisKey(cacheKey))
    if (!value) {
      return null
    }

    return JSON.parse(value) as QueryResponse
  }

  async set(cacheKey: string, value: QueryResponse, ttlSeconds: number): Promise<void> {
    await this.redis.set(this.toRedisKey(cacheKey), JSON.stringify(value), 'EX', ttlSeconds)
  }

  async ping(): Promise<boolean> {
    return (await this.redis.ping()) === 'PONG'
  }

  private toRedisKey(cacheKey: string): string {
    return `${this.namespace}:${cacheKey}`
  }
}

export class NullQueryCache implements QueryCache {
  async get(): Promise<QueryResponse | null> {
    return null
  }

  async set(): Promise<void> {}

  async ping(): Promise<boolean> {
    return true
  }
}
