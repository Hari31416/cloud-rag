from __future__ import annotations

import asyncio

from .logging import configure_logging
from .queue_worker import run_worker
from .settings import get_settings
from .telemetry import configure_telemetry


def main() -> None:
    settings = get_settings()
    configure_logging(settings.log_level)
    configure_telemetry(settings.service_name, settings.otel_sdk_disabled)
    asyncio.run(run_worker(settings))


if __name__ == "__main__":
    main()
