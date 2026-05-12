import pino from 'pino'

export function createLogger(level = process.env.LOG_LEVEL ?? 'info') {
  return pino({
    level,
    base: {
      service: 'cloudrag-gateway',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  })
}
