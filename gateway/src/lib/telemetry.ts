import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

export function startTelemetry(serviceName: string): NodeSDK | null {
  if (process.env.OTEL_SDK_DISABLED === 'true') {
    return null
  }

  const sdk = new NodeSDK({
    serviceName,
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start()
  return sdk
}
