import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', c => c.json({ status: 'ok' }))
app.get('/ready', c => c.json({ status: 'ready' }))

const port = Number(process.env.GATEWAY_PORT ?? 3000)

serve(
  {
    fetch: app.fetch,
    port,
  },
  info => {
    console.log(`Gateway listening on http://localhost:${info.port}`)
  },
)
