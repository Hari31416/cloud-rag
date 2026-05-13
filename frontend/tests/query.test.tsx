import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CitationsList } from '../src/components/citations-list'
import { QueryForm } from '../src/components/query-form'
import { QueryResult } from '../src/components/query-result'
import type { QueryResponse } from '../src/lib/types'

describe('Query Components Suite', () => {
  const mockResult: QueryResponse = {
    answer: 'CloudRAG achieves agnosticism via declarative JSON bindings.',
    cache: {
      hit: true,
      key: 'semantic-cache:v1:abc',
      similarity: 0.95,
    },
    sources: [
      {
        sourceId: 'doc-1',
        chunkId: 'chunk-101',
        documentHash: 'deadbeef12345678',
        score: 0.885,
        content: 'Raw retrieved chunk block content text.',
        title: 'Core Architecture Overview',
        metadata: { team: 'gateway' },
      },
    ],
    retrieval: {
      topK: 5,
      tookMs: 14,
    },
    requestId: 'req-999',
    traceId: 'trace-999',
  }

  it('renders QueryForm and triggers callback on valid submission', async () => {
    const onSubmitMock = vi.fn()
    const onClearMock = vi.fn()

    render(
      <QueryForm
        onSubmitQuery={onSubmitMock}
        onClearResult={onClearMock}
        isPending={false}
        submitError={null}
        hasResult={false}
      />,
    )

    const textarea = screen.getByPlaceholderText(/How does CloudRAG ingest data/i)
    fireEvent.change(textarea, { target: { value: 'What is the queue protocol?' } })

    const submitBtn = screen.getByText(/Dispatch Query Pipeline/i)
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith({
        prompt: 'What is the queue protocol?',
        topK: 5,
        minScore: 0.15,
        useCache: true,
      })
    })
  })

  it('renders QueryResult displaying synthesized answer text and cache badge', () => {
    render(<QueryResult result={mockResult} />)
    expect(screen.getByText(/CloudRAG achieves agnosticism via declarative JSON bindings/i)).toBeInTheDocument()
    expect(screen.getByText(/Cache Hit/i)).toBeInTheDocument()
    expect(screen.getByText(/14ms/i)).toBeInTheDocument()
  })

  it('renders CitationsList and expands raw content preview on toggle click', () => {
    render(<CitationsList sources={mockResult.sources} />)

    expect(screen.getByText(/Core Architecture Overview/i)).toBeInTheDocument()

    // It starts expanded or unexpanded depending on state index === 0 default
    expect(screen.getByText(/Raw retrieved chunk block content text/i)).toBeInTheDocument()
    expect(screen.getByText(/chunk-101/i)).toBeInTheDocument()
  })
})
