import type { Job } from 'bullmq'
import { Queue, QueueEvents } from 'bullmq'
import type IORedis from 'ioredis'

import type {
  IngestJobEnvelope,
  QueryJobEnvelope,
  WorkerQueryResult,
} from '../contracts'

export interface QueueAdapter {
  enqueueIngest(envelope: IngestJobEnvelope, jobId: string): Promise<string>
  executeQuery(envelope: QueryJobEnvelope, jobId: string, timeoutMs: number): Promise<WorkerQueryResult>
  ping(): Promise<boolean>
  close(): Promise<void>
}

export class BullMqQueueAdapter implements QueueAdapter {
  private readonly queue: Queue
  private readonly queueEvents: QueueEvents

  constructor(
    private readonly connection: IORedis,
    private readonly queueName: string,
  ) {
    this.queue = new Queue(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1_000,
        },
        removeOnComplete: 200,
        removeOnFail: 500,
      },
    })
    this.queueEvents = new QueueEvents(queueName, {
      connection,
    })
  }

  async enqueueIngest(envelope: IngestJobEnvelope, jobId: string): Promise<string> {
    const job = await this.queue.add(envelope.jobName, envelope, {
      jobId,
    })

    return job.id ?? jobId
  }

  async executeQuery(
    envelope: QueryJobEnvelope,
    jobId: string,
    timeoutMs: number,
  ): Promise<WorkerQueryResult> {
    const job = await this.queue.add(envelope.jobName, envelope, {
      jobId,
    })

    const result = await this.waitForResult(job, timeoutMs)
    return result as WorkerQueryResult
  }

  async ping(): Promise<boolean> {
    return (await this.connection.ping()) === 'PONG'
  }

  async close(): Promise<void> {
    await this.queueEvents.close()
    await this.queue.close()
  }

  private async waitForResult(job: Job, timeoutMs: number): Promise<unknown> {
    await this.queueEvents.waitUntilReady()
    return job.waitUntilFinished(this.queueEvents, timeoutMs)
  }
}
