import { useQuery } from '@tanstack/react-query'
import { getReady } from '../lib/api'
import type { ReadyResponse } from '../lib/types'

export function useReady() {
  return useQuery<ReadyResponse, Error>({
    queryKey: ['ready'],
    queryFn: getReady,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  })
}
