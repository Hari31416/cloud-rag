from __future__ import annotations

from time import perf_counter
from typing import Any

import litellm

from .logging import get_logger

litellm._turn_off_async_logging = True


def _extract_embedding_data(response: Any) -> list[list[float]]:
    data = getattr(response, "data", None)
    if data is None and isinstance(response, dict):
        data = response.get("data")
    if not isinstance(data, list):
        raise ValueError("Embedding response did not include a valid data list")

    vectors: list[list[float]] = []
    for item in data:
        embedding = getattr(item, "embedding", None)
        if embedding is None and isinstance(item, dict):
            embedding = item.get("embedding")
        if not isinstance(embedding, list):
            raise ValueError("Embedding response item did not include a valid embedding vector")
        vectors.append([float(value) for value in embedding])
    return vectors


async def embedding_completion(
    *,
    model: str,
    inputs: list[str],
    api_key: str | None = None,
    api_base: str | None = None,
    dimensions: int | None = None,
) -> list[list[float]]:
    logger = get_logger()
    started = perf_counter()
    logger.info("embedding call started", model=model, batch_size=len(inputs))

    try:
        kwargs: dict[str, Any] = {
            "model": model,
            "input": inputs,
        }
        if api_key:
            kwargs["api_key"] = api_key
        if api_base:
            kwargs["api_base"] = api_base
        if dimensions is not None:
            kwargs["dimensions"] = dimensions

        response = await litellm.aembedding(**kwargs)
        vectors = _extract_embedding_data(response)
        logger.info(
            "embedding call finished",
            model=model,
            batch_size=len(inputs),
            duration_ms=int((perf_counter() - started) * 1000),
        )
        return vectors
    except Exception:
        logger.exception("embedding call failed", model=model, batch_size=len(inputs))
        raise


async def text_completion(
    *,
    model: str,
    messages: list[dict[str, str]],
    api_key: str | None = None,
    api_base: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> str:
    logger = get_logger()
    started = perf_counter()
    logger.info("llm call started", model=model, message_count=len(messages))

    try:
        kwargs: dict[str, Any] = {
            "model": model,
            "messages": messages,
        }
        if api_key:
            kwargs["api_key"] = api_key
        if api_base:
            kwargs["api_base"] = api_base
        if temperature is not None:
            kwargs["temperature"] = temperature
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens

        response = await litellm.acompletion(**kwargs)
        choice = response.choices[0]
        message = getattr(choice, "message", None)
        content = getattr(message, "content", None)
        if content is None and isinstance(choice, dict):
            content = choice.get("message", {}).get("content")
        if not isinstance(content, str) or not content.strip():
            raise ValueError("LLM response did not contain a usable text answer")

        logger.info(
            "llm call finished",
            model=model,
            duration_ms=int((perf_counter() - started) * 1000),
        )
        return content.strip()
    except Exception:
        logger.exception("llm call failed", model=model, message_count=len(messages))
        raise
