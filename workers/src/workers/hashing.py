from __future__ import annotations

import hashlib
import json
import math
import re
from collections import Counter


TOKEN_RE = re.compile(r"[A-Za-z0-9]+")


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def tokenize(text: str) -> list[str]:
    return [match.group(0).lower() for match in TOKEN_RE.finditer(text)]


def normalize_prompt(prompt: str) -> str:
    return " ".join(prompt.strip().split())


def build_cache_key(
    prompt: str,
    top_k: int,
    min_score: float,
    collection_name: str,
    embedding_model: str,
    prompt_template_version: str,
) -> str:
    material = "|".join(
        [
            "semantic-cache",
            "v1",
            normalize_prompt(prompt),
            str(top_k),
            f"{min_score:.4f}",
            collection_name,
            embedding_model,
            prompt_template_version,
        ]
    )
    return f"semantic-cache:v1:{sha256_text(material)}"


def make_sparse_vector(text: str, dimensions: int) -> dict[int, float]:
    counts = Counter(tokenize(text))
    total = sum(counts.values())
    if total == 0:
        return {}

    sparse_vector: dict[int, float] = {}
    for token, count in counts.items():
        index = int(hashlib.sha256(token.encode("utf-8")).hexdigest(), 16) % dimensions
        sparse_vector[index] = sparse_vector.get(index, 0.0) + (count / total)
    return sparse_vector


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    numerator = sum(a * b for a, b in zip(left, right, strict=True))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return numerator / (left_norm * right_norm)


def sparse_dot(left: dict[int, float], right: dict[int, float]) -> float:
    if len(left) > len(right):
        left, right = right, left
    return sum(value * right.get(index, 0.0) for index, value in left.items())


def stable_json(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))

