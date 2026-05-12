from __future__ import annotations

from typing import Protocol

import boto3
from botocore.config import Config


class ObjectStorage(Protocol):
    async def ensure_bucket(self) -> None: ...

    async def put_text(self, object_key: str, content: str, content_type: str) -> str: ...


class MemoryObjectStorage:
    def __init__(self) -> None:
        self.objects: dict[str, str] = {}

    async def ensure_bucket(self) -> None:
        return None

    async def put_text(self, object_key: str, content: str, content_type: str) -> str:
        self.objects[object_key] = content
        return object_key


class S3ObjectStorage:
    def __init__(
        self,
        endpoint_url: str,
        region_name: str,
        access_key_id: str,
        secret_access_key: str,
        bucket_name: str,
        force_path_style: bool = True,
    ) -> None:
        self.bucket_name = bucket_name
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            region_name=region_name,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=Config(s3={"addressing_style": "path" if force_path_style else "virtual"}),
        )

    async def ensure_bucket(self) -> None:
        buckets = self.client.list_buckets().get("Buckets", [])
        if any(bucket["Name"] == self.bucket_name for bucket in buckets):
            return
        self.client.create_bucket(Bucket=self.bucket_name)

    async def put_text(self, object_key: str, content: str, content_type: str) -> str:
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=object_key,
            Body=content.encode("utf-8"),
            ContentType=content_type,
        )
        return object_key

