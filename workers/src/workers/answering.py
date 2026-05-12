from __future__ import annotations

from typing import Protocol

from .contracts import SourceReference


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
    def __init__(self, model: str, prompt_template_version: str) -> None:
        self.model = model
        self.prompt_template_version = prompt_template_version

    async def generate_answer(self, prompt: str, sources: list[SourceReference]) -> str:
        from litellm import acompletion

        context = "\n\n".join(
            f"Source {index + 1} ({source.source_id}/{source.chunk_id}): {source.content}"
            for index, source in enumerate(sources[:5])
        )
        response = await acompletion(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Answer using the provided sources only. "
                        f"Prompt template version: {self.prompt_template_version}."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Question:\n{prompt}\n\nSources:\n{context}",
                },
            ],
        )
        return response["choices"][0]["message"]["content"]

