import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { postQuery } from '../lib/api'
import type { QueryRequest, QueryResponse } from '../lib/types'

export function useQueryRag() {
  const [lastResult, setLastResult] = useState<QueryResponse | null>(null)

  const mutation = useMutation<QueryResponse, Error, QueryRequest>({
    mutationFn: postQuery,
    onSuccess: (data) => {
      setLastResult(data)
    },
  })

  const clearResult = useCallback(() => {
    setLastResult(null)
    mutation.reset()
  }, [mutation])

  return {
    ...mutation,
    lastResult,
    clearResult,
  }
}
