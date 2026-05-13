export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || ''
}

export function getEnvironmentBadge(): string {
  const url = getApiBaseUrl()
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
    return 'local'
  }
  if (url.includes('staging')) {
    return 'staging'
  }
  return 'production'
}
