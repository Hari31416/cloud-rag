from __future__ import annotations

from dataclasses import dataclass

from .hashing import sha256_text


@dataclass(frozen=True)
class ChunkDraft:
    chunk_id: str
    chunk_hash: str
    content: str


def split_text(text: str, source_id: str, document_hash: str, chunk_size: int, chunk_overlap: int) -> list[ChunkDraft]:
    cleaned = text.strip()
    if not cleaned:
        return []

    chunks: list[ChunkDraft] = []
    start = 0
    index = 0
    step = max(chunk_size - chunk_overlap, 1)
    while start < len(cleaned):
        candidate = cleaned[start : start + chunk_size]
        end = start + len(candidate)
        if end < len(cleaned):
            boundary = candidate.rfind(" ")
            if boundary > chunk_size // 2:
                candidate = candidate[:boundary]
                end = start + boundary
        normalized = candidate.strip()
        if normalized:
            chunk_hash = sha256_text(normalized)
            chunk_id = sha256_text(f"{source_id}:{document_hash}:{index}:{chunk_hash}")[:32]
            chunks.append(ChunkDraft(chunk_id=chunk_id, chunk_hash=chunk_hash, content=normalized))
            index += 1
        if end <= start:
            end = start + step
        start = max(end - chunk_overlap, start + step)
    return chunks

