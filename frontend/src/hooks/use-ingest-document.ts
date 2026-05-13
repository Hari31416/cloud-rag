import { useMutation } from '@tanstack/react-query'
import { postIngest } from '../lib/api'
import type { IngestAcceptedResponse, IngestRequest } from '../lib/types'

export function useIngestDocument() {
  return useMutation<IngestAcceptedResponse, Error, IngestRequest>({
    mutationFn: postIngest,
  })
}
