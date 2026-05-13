import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IngestForm } from '../src/components/ingest-form'

vi.mock('../src/hooks/use-ingest-document', () => ({
  useIngestDocument: vi.fn(() => ({
    mutate: vi.fn((_payload, options: { onSuccess?: (data: unknown) => void }) => {
      if (options?.onSuccess) {
        options.onSuccess({
          status: 'accepted',
          taskId: 'source-1:hash123',
          sourceId: 'source-1',
          documentHash: 'hash123',
          queue: 'cloudrag-jobs',
          requestId: 'req-uuid',
          traceId: 'trace-uuid',
        })
      }
    }),
    isPending: false,
    error: null,
  })),
}))

describe('IngestForm Component', () => {
  it('renders required content textarea and triggers validation error when empty', async () => {
    const onSuccessMock = vi.fn()
    render(<IngestForm onSuccessIngest={onSuccessMock} />)

    const submitBtn = screen.getByText(/Submit Ingestion Request/i)
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Plain text content is strictly required/i)).toBeInTheDocument()
    })
    expect(onSuccessMock).not.toHaveBeenCalled()
  })

  it('submits successfully when plain text content is filled', async () => {
    const onSuccessMock = vi.fn()
    render(<IngestForm onSuccessIngest={onSuccessMock} />)

    const textarea = screen.getByPlaceholderText(/Paste plain text document content here/i)
    fireEvent.change(textarea, { target: { value: 'Valid cloud document chunk payload' } })

    const submitBtn = screen.getByText(/Submit Ingestion Request/i)
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled()
      expect(screen.getByText(/Ingestion Payload Accepted Successfully/i)).toBeInTheDocument()
      expect(screen.getByText('source-1:hash123')).toBeInTheDocument()
    })
  })
})
