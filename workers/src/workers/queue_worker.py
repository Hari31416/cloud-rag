from __future__ import annotations

import asyncio
import signal
from urllib.parse import urlparse

from bullmq import Worker

from .container import build_container
from .contracts import IngestJobEnvelope, QueryJobEnvelope
from .logging import get_logger
from .settings import WorkerSettings


async def run_worker(settings: WorkerSettings) -> None:
    logger = get_logger()

    from redis import asyncio as redis_async
    from redis.exceptions import AuthenticationError, ConnectionError as RedisConnectionError

    logger.info("verifying redis connection", redis_url=settings.redis_url)
    max_attempts = 15
    for attempt in range(1, max_attempts + 1):
        client = redis_async.from_url(settings.redis_url)
        try:
            await client.ping()
            logger.info("redis connection established successfully")
            await client.close()
            break
        except AuthenticationError as auth_err:
            await client.close()
            if "without any password configured" in str(auth_err):
                logger.warning(
                    "redis server does not require authentication; stripping password from configuration"
                )
                parsed = urlparse(settings.redis_url)
                netloc = (
                    f"{parsed.hostname}:{parsed.port}"
                    if parsed.port
                    else (parsed.hostname or "localhost")
                )
                settings.redis_url = parsed._replace(netloc=netloc).geturl()
                unauth_client = redis_async.from_url(settings.redis_url)
                try:
                    await unauth_client.ping()
                    logger.info("unauthenticated redis connection established successfully")
                finally:
                    await unauth_client.close()
                break
            logger.error("redis authentication failed", error=str(auth_err))
            raise
        except (RedisConnectionError, OSError) as conn_err:
            await client.close()
            if attempt == max_attempts:
                logger.error("redis connection timed out", attempts=attempt)
                raise
            logger.debug("redis not ready, retrying...", attempt=attempt, error=str(conn_err))
            await asyncio.sleep(1.0)

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

    parsed = urlparse(settings.redis_url)
    connection_opts = {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 6379,
        "db": int(parsed.path.lstrip("/")) if parsed.path.lstrip("/") else 0,
    }
    if parsed.password:
        connection_opts["password"] = parsed.password

    worker = Worker(
        settings.queue_name,
        processor,
        {
            "connection": connection_opts,
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
