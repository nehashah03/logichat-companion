"""
Pydantic models — the *only* place we trust input.

All inbound payloads (REST + WebSocket) are validated here. Strings are
length-bounded, attachment metadata is capped, IDs are constrained to
the UUID-4 character set so we can safely use them as filenames.
"""
from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator

# ---- limits ---------------------------------------------------------------
MAX_MSG_LEN = 8000
MAX_TITLE_LEN = 120
MAX_ATTACHMENT_TOTAL_MB = 10
MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_TOTAL_MB * 1024 * 1024

# UUID4-ish — accept lower-case hex with dashes only
_UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


def assert_uuid(value: str) -> str:
    """Raise ValueError if `value` is not a UUID-4 string. Used to sanitise
    any id that becomes part of a filesystem path."""
    if not _UUID_RE.match(value or ""):
        raise ValueError("invalid id")
    return value


# ---- models --------------------------------------------------------------
class AttachmentMeta(BaseModel):
    name: str = Field(..., max_length=200)
    size: int = Field(..., ge=0, le=MAX_ATTACHMENT_BYTES)
    type: str = Field(default="", max_length=120)


class PasteSnippet(BaseModel):
    id: str
    language: str = Field(..., max_length=30)
    content: str = Field(..., max_length=200_000)  # generous; snippets can be big
    lines: int = Field(..., ge=0, le=200_000)


class ChatPayload(BaseModel):
    """Payload sent over the WebSocket for a single user turn."""
    type: str = Field(default="message")  # "message"
    turnId: str  # client-supplied UUID — used to address cancellations
    sessionId: str
    content: str = Field(..., max_length=MAX_MSG_LEN)
    attachments: list[AttachmentMeta] = Field(default_factory=list)
    snippets: list[PasteSnippet] = Field(default_factory=list)

    @field_validator("turnId", "sessionId")
    @classmethod
    def _uuid_only(cls, v: str) -> str:
        return assert_uuid(v)


class CancelPayload(BaseModel):
    type: str  # "cancel"
    turnId: str

    @field_validator("turnId")
    @classmethod
    def _uuid_only(cls, v: str) -> str:
        return assert_uuid(v)


class CreateSessionPayload(BaseModel):
    title: Optional[str] = Field(default=None, max_length=MAX_TITLE_LEN)


class PatchSessionPayload(BaseModel):
    title: Optional[str] = Field(default=None, max_length=MAX_TITLE_LEN)
    favorite: Optional[bool] = None