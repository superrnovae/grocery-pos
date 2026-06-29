import { createServer, type IncomingMessage, type Server } from 'http'
import type { SyncMode, SyncStatus } from '@shared/types'
import type { SyncRepository, SyncSnapshot } from '../db/syncRepository'

const POLL_INTERVAL_MS = 5000
const EPOCH = '0000-01-01T00:00:00.000Z'

export interface SyncController {
  start(mode: SyncMode, options: { port: number; host: string }): void
  stop(): void
  syncNow(): Promise<void>
  getStatus(): SyncStatus
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export function createSyncController(repository: SyncRepository): SyncController {
  let server: Server | null = null
  let pollTimer: NodeJS.Timeout | null = null
  let mode: SyncMode = 'off'
  let clientTarget = ''
  let lastSyncedAt: string | null = null
  let lastError: string | null = null

  function startHost(port: number): void {
    server = createServer((req, res) => {
      void (async (): Promise<void> => {
        try {
          const url = new URL(req.url ?? '/', `http://localhost:${port}`)

          if (req.method === 'GET' && url.pathname === '/sync/state') {
            const since = url.searchParams.get('since') ?? EPOCH
            const snapshot = repository.getChangesSince(since)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(snapshot))
            return
          }

          if (req.method === 'POST' && url.pathname === '/sync/push') {
            const body = await readBody(req)
            repository.applyChanges(JSON.parse(body) as SyncSnapshot)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
            return
          }

          res.writeHead(404)
          res.end()
        } catch (error) {
          console.error('Sync host request failed', error)
          res.writeHead(500)
          res.end()
        }
      })()
    })
    server.listen(port)
  }

  async function pollOnce(): Promise<void> {
    const since = lastSyncedAt ?? EPOCH

    const stateResponse = await fetch(
      `${clientTarget}/sync/state?since=${encodeURIComponent(since)}`
    )
    if (!stateResponse.ok) throw new Error(`Host returned ${stateResponse.status}`)
    repository.applyChanges((await stateResponse.json()) as SyncSnapshot)

    const pushResponse = await fetch(`${clientTarget}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repository.getChangesSince(since))
    })
    if (!pushResponse.ok) throw new Error(`Host returned ${pushResponse.status}`)

    lastSyncedAt = new Date().toISOString()
    lastError = null
  }

  function pollAndReportErrors(): void {
    pollOnce().catch((error: unknown) => {
      lastError = error instanceof Error ? error.message : String(error)
      console.error('Sync poll failed', error)
    })
  }

  function startClient(host: string, port: number): void {
    clientTarget = `http://${host}:${port}`
    pollAndReportErrors()
    pollTimer = setInterval(pollAndReportErrors, POLL_INTERVAL_MS)
  }

  return {
    start(newMode, options): void {
      server?.close()
      server = null
      if (pollTimer) clearInterval(pollTimer)
      pollTimer = null
      lastError = null
      mode = newMode

      if (newMode === 'host') startHost(options.port)
      else if (newMode === 'client') startClient(options.host, options.port)
    },

    stop(): void {
      server?.close()
      server = null
      if (pollTimer) clearInterval(pollTimer)
      pollTimer = null
      mode = 'off'
    },

    async syncNow(): Promise<void> {
      if (mode !== 'client') return
      try {
        await pollOnce()
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        throw error
      }
    },

    getStatus(): SyncStatus {
      return {
        mode,
        running: mode === 'host' ? server !== null : pollTimer !== null,
        lastSyncedAt,
        lastError
      }
    }
  }
}
