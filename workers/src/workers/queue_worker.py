from __future__ import annotations

import asyncio
import signal

from bullmq import Worker

from .container import build_container
from .contracts import IngestJobEnvelope, QueryJobEnvelope
from .logging import get_logger
from .settings import WorkerSettings


async def run_worker(settings: WorkerSettings) -> None:
    logger = get_logger()
    container = build_container(settings)

    async def processor(job, job_token):
        del job_token
        logger.info(
            "worker job received",
            job_id=job.id,
            job_name=job.name,
            attempts_made=getattr(job, "attempts_made", getattr(job, "attemptsMade", None)),
        )
        if job.name == "ingest.v1":
            envelope = IngestJobEnvelope.model_validate(job.data)
            result = await container.ingestion_service.ingest(envelope)
            return result.model_dump(mode="json", by_alias=True)
        if job.name == "query.v1":
            envelope = QueryJobEnvelope.model_validate(job.data)
            result = await container.query_service.query(envelope)
            return result.model_dump(mode="json", by_alias=True)
        raise ValueError(f"Unsupported job name: {job.name}")

    worker = Worker(
        settings.queue_name,
        processor,
        {
            "connection": {"url": settings.redis_url},
            "concurrency": 10,
        },
    )
    stop_event = asyncio.Event()

    def request_stop() -> None:
        if not stop_event.is_set():
            stop_event.set()

    loop = asyncio.get_running_loop()
    for handled_signal in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(handled_signal, request_stop)

    try:
        await stop_event.wait()
    finally:
        logger.info("stopping worker")
        await worker.close()
        close = getattr(container.vector_store, "close", None)
        if callable(close):
            await close()
