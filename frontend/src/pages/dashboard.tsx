import { AppShell } from '../components/app-shell'
import { CitationsList } from '../components/citations-list'
import { HealthPanel } from '../components/health-panel'
import { IngestForm } from '../components/ingest-form'
import { IngestHistory } from '../components/ingest-history'
import { QueryForm } from '../components/query-form'
import { QueryResult } from '../components/query-result'
import { useIngestHistory } from '../hooks/use-ingest-history'
import { useQueryRag } from '../hooks/use-query-rag'

export function Dashboard() {
  const { entries, addEntry, clearHistory } = useIngestHistory()
  const { mutate, isPending, error, lastResult, clearResult } = useQueryRag()

  // Centered, beautiful flex layout matching AskAtlas AI layout overhaul
  const queryContent = (
    <div className='flex flex-col items-center gap-6 w-full animate-fadeIn'>
      <QueryForm
        onSubmitQuery={mutate}
        onClearResult={clearResult}
        isPending={isPending}
        submitError={error}
        hasResult={lastResult !== null}
      />

      {lastResult && (
        <div className='w-full max-w-3xl flex flex-col gap-4 animate-fadeIn mt-2'>
          <QueryResult result={lastResult} />
          <CitationsList sources={lastResult.sources || []} />
        </div>
      )}
    </div>
  )

  // Ingestion Workspace content
  const ingestContent = (
    <div className='flex flex-col items-center gap-8 w-full animate-fadeIn'>
      <IngestForm onSuccessIngest={addEntry} />
      <IngestHistory entries={entries} onClearHistory={clearHistory} />
    </div>
  )

  // System Health tab content
  const healthContent = (
    <div className='flex flex-col items-center w-full animate-fadeIn'>
      <HealthPanel />
    </div>
  )

  return (
    <AppShell
      queryContent={queryContent}
      ingestContent={ingestContent}
      healthContent={healthContent}
    />
  )
}
