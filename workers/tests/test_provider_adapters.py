from __future__ import annotations

from workers.answering import LiteLLMAnswerGenerator
from workers.contracts import SourceReference
from workers.embeddings import LiteLLMEmbeddingAdapter


async def test_litellm_embedding_adapter_batches_requests(monkeypatch) -> None:
    calls: list[list[str]] = []

    async def fake_embedding_completion(**kwargs):
        batch = kwargs["inputs"]
        calls.append(batch)
        return [[0.1, 0.2, 0.3] for _ in batch]

    monkeypatch.setattr(
        "workers.embeddings.embedding_completion",
        fake_embedding_completion,
    )

    adapter = LiteLLMEmbeddingAdapter(
        model="text-embedding-3-small",
        dimensions=3,
        batch_size=2,
    )

    vectors = await adapter.embed_texts(["one", "two", "three", "four", "five"])

    assert len(vectors) == 5
    assert calls == [["one", "two"], ["three", "four"], ["five"]]


async def test_litellm_embedding_adapter_rejects_dimension_mismatch(monkeypatch) -> None:
    async def fake_embedding_completion(**kwargs):
        return [[0.1, 0.2]]

    monkeypatch.setattr(
        "workers.embeddings.embedding_completion",
        fake_embedding_completion,
    )

    adapter = LiteLLMEmbeddingAdapter(
        model="text-embedding-3-small",
        dimensions=3,
    )

    try:
        await adapter.embed_text("hello")
    except ValueError as exc:
        assert "Embedding dimension mismatch" in str(exc)
    else:
        raise AssertionError("Expected dimension mismatch to raise ValueError")


async def test_litellm_answer_generator_uses_llm_wrapper(monkeypatch) -> None:
    captured: dict[str, object] = {}

    async def fake_text_completion(**kwargs):
        captured.update(kwargs)
        return "Vectors are stored in Qdrant [source-1/chunk-1]"

    monkeypatch.setattr(
        "workers.answering.text_completion",
        fake_text_completion,
    )

    generator = LiteLLMAnswerGenerator(
        model="gpt-4.1-mini",
        prompt_template_version="2026-05-12",
        api_key="test-key",
        api_base="https://example.com/v1",
    )

    answer = await generator.generate_answer(
        "Where are vectors stored?",
        [
            SourceReference(
                sourceId="source-1",
                chunkId="chunk-1",
                documentHash="doc-1",
                score=0.8,
                content="CloudRAG stores vectors in Qdrant.",
                title="Architecture",
                metadata={},
            )
        ],
    )

    assert answer == "Vectors are stored in Qdrant [source-1/chunk-1]"
    assert captured["model"] == "gpt-4.1-mini"
    assert captured["api_key"] == "test-key"
    assert captured["api_base"] == "https://example.com/v1"
    messages = captured["messages"]
    assert isinstance(messages, list)
    assert "Where are vectors stored?" in messages[1]["content"]
