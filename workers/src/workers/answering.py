from __future__ import annotations

from typing import Protocol

from .contracts import SourceReference
from .llm_utils import text_completion


class AnswerGenerator(Protocol):
    async def generate_answer(self, prompt: str, sources: list[SourceReference]) -> str: ...


class ExtractiveAnswerGenerator:
    async def generate_answer(self, prompt: str, sources: list[SourceReference]) -> str:
        if not sources:
            return "I could not find supporting content for that question in the ingested corpus."

        snippets = []
        for source in sources[:3]:
            snippet = source.content.strip().replace("\n", " ")
            snippets.append(f"[{source.source_id}] {snippet[:240]}")
        return f"Question: {prompt}\n\nRelevant excerpts:\n" + "\n".join(snippets)


class LiteLLMAnswerGenerator:
    def __init__(
        self,
        model: str,
        prompt_template_version: str,
        api_key: str | None = None,
        api_base: str | None = None,
    ) -> None:
        self.model = model
        self.prompt_template_version = prompt_template_version
        self.api_key = api_key
        self.api_base = api_base

    async def generate_answer(self, prompt: str, sources: list[SourceReference]) -> str:
        if not sources:
            return "I could not find supporting content for that question in the ingested corpus."

        context = "\n\n".join(
            f"Source {index + 1} [{source.source_id}/{source.chunk_id}]\n"
            f"Title: {source.title or 'Untitled'}\n"
            f"Content: {source.content}"
            for index, source in enumerate(sources[:5])
        )
        return await text_completion(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a retrieval-augmented assistant. "
                        "Answer using only the provided sources. "
                        "If the sources are insufficient, say that clearly. "
                        "Cite factual claims inline using [source_id/chunk_id]. "
                        f"Prompt template version: {self.prompt_template_version}."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Question:\n{prompt}\n\nSources:\n{context}",
                },
            ],
            api_key=self.api_key,
            api_base=self.api_base,
        )
