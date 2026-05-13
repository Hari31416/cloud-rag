export interface MetadataRow {
  key: string
  value: string
}

export function rowsToMetadata(rows: MetadataRow[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const row of rows) {
    const trimmedKey = row.key.trim()
    if (trimmedKey) {
      result[trimmedKey] = row.value.trim()
    }
  }
  return result
}

export function metadataToRows(metadata: Record<string, string>): MetadataRow[] {
  return Object.entries(metadata).map(([key, value]) => ({
    key,
    value,
  }))
}

export function hasDuplicateKeys(rows: MetadataRow[]): boolean {
  const seen = new Set<string>()
  for (const row of rows) {
    const trimmedKey = row.key.trim()
    if (trimmedKey) {
      if (seen.has(trimmedKey)) {
        return true
      }
      seen.add(trimmedKey)
    }
  }
  return false
}
