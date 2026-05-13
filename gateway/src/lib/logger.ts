import pino from 'pino'

export function createLogger(level = process.env.LOG_LEVEL ?? 'info') {
  return pino({
    level,
    base: {
      service: 'cloudrag-gateway',
    },
    serializers: {
      error: pino.stdSerializers.err,
      err: pino.stdSerializers.err,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  })
}
