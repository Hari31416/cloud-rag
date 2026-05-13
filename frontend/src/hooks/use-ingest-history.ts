import { useCallback, useEffect, useState } from 'react'
import type { LocalIngestEntry } from '../lib/types'

const STORAGE_KEY = 'cloudrag_ingest_history_v1'

export function useIngestHistory() {
  const [entries, setEntries] = useState<LocalIngestEntry[]>([])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as unknown
        if (Array.isArray(parsed)) {
          setEntries(parsed as LocalIngestEntry[])
        }
      }
    } catch {
      // ignore parse error
    }
  }, [])

  const addEntry = useCallback((entry: LocalIngestEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev]
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore storage failure
      }
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setEntries([])
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore storage failure
    }
  }, [])

  return {
    entries,
    addEntry,
    clearHistory,
  }
}
