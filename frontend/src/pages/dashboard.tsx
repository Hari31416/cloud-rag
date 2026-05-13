import { AppShell } from '../components/app-shell'
import { CitationsList } from '../components/citations-list'
import { EmptyState } from '../components/empty-state'
import { IngestForm } from '../components/ingest-form'
import { IngestHistory } from '../components/ingest-history'
import { QueryForm } from '../components/query-form'
import { QueryResult } from '../components/query-result'
import { useIngestHistory } from '../hooks/use-ingest-history'
import { useQueryRag } from '../hooks/use-query-rag'

export function Dashboard() {
  const { entries, addEntry, clearHistory } = useIngestHistory()
  const { mutate, isPending, error, lastResult, clearResult } = useQueryRag()

  const ingestContent = (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      <IngestForm onSuccessIngest={addEntry} />
      <IngestHistory entries={entries} onClearHistory={clearHistory} />
    </div>
  )

  const queryContent = (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
      <div className='lg:col-span-5'>
        <QueryForm
          onSubmitQuery={mutate}
          onClearResult={clearResult}
          isPending={isPending}
          submitError={error}
          hasResult={lastResult !== null}
        />
      </div>

      <div className='lg:col-span-7 flex flex-col gap-6'>
        {lastResult ? (
          <>
            <QueryResult result={lastResult} />
            <CitationsList sources={lastResult.sources || []} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )

  return <AppShell ingestContent={ingestContent} queryContent={queryContent} />
}
