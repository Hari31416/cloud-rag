import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../lib/api'
import type { HealthResponse } from '../lib/types'

export function useHealth() {
  return useQuery<HealthResponse, Error>({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  })
}
