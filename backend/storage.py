# """
# JSON-file session storage with atomic writes.

# Why JSON files? The user explicitly asked for file-based storage instead of
# a database. Each session lives in its own file:

#     backend/data/sessions/<uuid>.json

# Writes are atomic (write-temp → fsync → os.replace) and are guarded by an
# asyncio lock keyed on session id, so concurrent WebSocket turns can never
# corrupt the file.
# """
# from __future__ import annotations

# import asyncio
# import json
# import os
# import time
# import tempfile
# from pathlib import Path
# from typing import Any, Optional

# from .schemas import assert_uuid


# # Resolve to backend/data/sessions regardless of CWD
# DATA_DIR = Path(__file__).resolve().parent / "data" / "sessions"
# DATA_DIR.mkdir(parents=True, exist_ok=True)

# # One lock per session — created lazily
# _locks: dict[str, asyncio.Lock] = {}


# def _lock_for(session_id: str) -> asyncio.Lock:
#     if session_id not in _locks:
#         _locks[session_id] = asyncio.Lock()
#     return _locks[session_id]


# def _path_for(session_id: str) -> Path:
#     # assert_uuid prevents path traversal — only UUID4 ids ever reach disk
#     assert_uuid(session_id)
#     return DATA_DIR / f"{session_id}.json"


# def _atomic_write(path: Path, data: dict[str, Any]) -> None:
#     """Write JSON atomically: temp file → fsync → rename."""
#     fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=".tmp_", suffix=".json")
#     try:
#         with os.fdopen(fd, "w", encoding="utf-8") as f:
#             json.dump(data, f, ensure_ascii=False, indent=2)
#             f.flush()
#             os.fsync(f.fileno())
#         os.replace(tmp, path)
#     except Exception:
#         try:
#             os.unlink(tmp)
#         except FileNotFoundError:
#             pass
#         raise


# # --------------------------------------------------------------------------
# # CRUD
# # --------------------------------------------------------------------------
# async def create_session(session_id: str, title: str = "New Conversation") -> dict:
#     now = time.time()
#     data = {
#         "id": session_id,
#         "title": title or "New Conversation",
#         "createdAt": now,
#         "updatedAt": now,
#         "favorite": False,
#         "messages": [],
#     }
#     async with _lock_for(session_id):
#         _atomic_write(_path_for(session_id), data)
#     return data


# async def get_session(session_id: str) -> Optional[dict]:
#     p = _path_for(session_id)
#     if not p.exists():
#         return None
#     # reads are snapshot-safe due to atomic writes; no lock required
#     with open(p, "r", encoding="utf-8") as f:
#         return json.load(f)


# async def list_sessions() -> list[dict]:
#     """Return lightweight metadata (no message bodies) sorted by updatedAt desc."""
#     out: list[dict] = []
#     for p in DATA_DIR.glob("*.json"):
#         try:
#             with open(p, "r", encoding="utf-8") as f:
#                 d = json.load(f)
#             out.append({
#                 "id": d["id"],
#                 "title": d.get("title", "New Conversation"),
#                 "createdAt": d.get("createdAt", 0),
#                 "updatedAt": d.get("updatedAt", 0),
#                 "favorite": bool(d.get("favorite", False)),
#                 "messageCount": len(d.get("messages", [])),
#                 # Snippet of first user message — useful for sidebar previews
#                 "preview": next(
#                     (m["content"][:120] for m in d.get("messages", []) if m.get("role") == "user"),
#                     "",
#                 ),
#             })
#         except (OSError, json.JSONDecodeError):
#             # Skip broken files rather than crash
#             continue
#     out.sort(key=lambda s: s["updatedAt"], reverse=True)
#     return out


# async def patch_session(session_id: str, *, title: Optional[str] = None, favorite: Optional[bool] = None) -> Optional[dict]:
#     async with _lock_for(session_id):
#         data = await get_session(session_id)
#         if data is None:
#             return None
#         if title is not None:
#             data["title"] = title.strip()[:120] or data["title"]
#         if favorite is not None:
#             data["favorite"] = bool(favorite)
#         data["updatedAt"] = time.time()
#         _atomic_write(_path_for(session_id), data)
#         return data


# async def delete_session(session_id: str) -> bool:
#     async with _lock_for(session_id):
#         p = _path_for(session_id)
#         if p.exists():
#             p.unlink()
#             return True
#     return False


# async def append_message(session_id: str, message: dict) -> Optional[dict]:
#     """Append one message and bump updatedAt; auto-title from first user msg."""
#     async with _lock_for(session_id):
#         data = await get_session(session_id)
#         if data is None:
#             return None
#         data["messages"].append(message)
#         data["updatedAt"] = time.time()
#         # Auto-title from first user message
#         if data.get("title") in (None, "", "New Conversation") and message.get("role") == "user":
#             text = (message.get("content") or "").strip().split("\n", 1)[0]
#             if text:
#                 data["title"] = text[:60]
#         _atomic_write(_path_for(session_id), data)
#         return data


# async def search(query: str) -> list[dict]:
#     """Search title + message bodies. Returns the same shape as list_sessions()."""
#     needle = (query or "").strip().lower()
#     if not needle:
#         return await list_sessions()

#     out: list[dict] = []
#     for p in DATA_DIR.glob("*.json"):
#         try:
#             with open(p, "r", encoding="utf-8") as f:
#                 d = json.load(f)
#         except (OSError, json.JSONDecodeError):
#             continue
#         title = (d.get("title") or "").lower()
#         in_title = needle in title
#         match_msg = next(
#             (m["content"] for m in d.get("messages", [])
#              if needle in (m.get("content") or "").lower()),
#             None,
#         )
#         if in_title or match_msg:
#             out.append({
#                 "id": d["id"],
#                 "title": d.get("title", "New Conversation"),
#                 "createdAt": d.get("createdAt", 0),
#                 "updatedAt": d.get("updatedAt", 0),
#                 "favorite": bool(d.get("favorite", False)),
#                 "messageCount": len(d.get("messages", [])),
#                 "matchSnippet": (match_msg or "")[:160],
#             })
#     out.sort(key=lambda s: s["updatedAt"], reverse=True)
#     return out

"""
storage.py

JSON-file based chat session storage.

Each session is stored as:

backend/data/sessions/<uuid>.json

Production-minded safeguards:
- UUID validation before building paths
- atomic writes
- per-session locks
- safe listing/searching even if one file is corrupted
"""

from __future__ import annotations

import asyncio
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any, Optional

from .schemas import assert_uuid


# ---------------------------------------------------------------------
# Storage location
# ---------------------------------------------------------------------

DATA_DIR = Path(__file__).resolve().parent / "data" / "sessions"
DATA_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------
# Per-session locks
# ---------------------------------------------------------------------

_locks: dict[str, asyncio.Lock] = {}


def _lock_for(session_id: str) -> asyncio.Lock:
    """
    Returns one asyncio lock per session.

    This protects the same session file from concurrent writes.
    """
    if session_id not in _locks:
        _locks[session_id] = asyncio.Lock()

    return _locks[session_id]


def _path_for(session_id: str) -> Path:
    """
    Build safe file path for one session.

    assert_uuid prevents:
    - ../ path traversal
    - arbitrary filenames
    - unexpected special characters
    """
    assert_uuid(session_id)
    return DATA_DIR / f"{session_id}.json"


def _atomic_write(path: Path, data: dict[str, Any]) -> None:
    """
    Safely write JSON using temp file + fsync + atomic replace.

    This avoids broken half-written JSON files if the process crashes midway.
    """
    fd, tmp = tempfile.mkstemp(
        dir=str(path.parent),
        prefix=".tmp_",
        suffix=".json",
    )

    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
            file.flush()
            os.fsync(file.fileno())

        os.replace(tmp, path)

    except Exception:
        try:
            os.unlink(tmp)
        except FileNotFoundError:
            pass

        raise


# ---------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------

async def create_session(session_id: str, title: str = "New Conversation") -> dict:
    """
    Create a new session.
    """
    now = time.time()

    data = {
        "id": session_id,
        "title": title.strip()[:120] if title else "New Conversation",
        "createdAt": now,
        "updatedAt": now,
        "favorite": False,
        "messages": [],
    }

    async with _lock_for(session_id):
        _atomic_write(_path_for(session_id), data)

    return data


async def ensure_session(session_id: str, title: str = "New Conversation") -> dict:
    """
    Ensure session exists.

    Useful for WebSocket-first flow:
    frontend can generate a sessionId and immediately send a message.
    """
    existing = await get_session(session_id)

    if existing is not None:
        return existing

    return await create_session(session_id, title=title)


async def get_session(session_id: str) -> Optional[dict]:
    """
    Read one full session including messages.
    """
    path = _path_for(session_id)

    if not path.exists():
        return None

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


async def list_sessions() -> list[dict]:
    """
    Return lightweight session metadata for sidebar.

    Does not return full message bodies.
    """
    sessions: list[dict] = []

    for path in DATA_DIR.glob("*.json"):
        try:
            with open(path, "r", encoding="utf-8") as file:
                data = json.load(file)

            messages = data.get("messages", [])

            sessions.append(
                {
                    "id": data["id"],
                    "title": data.get("title", "New Conversation"),
                    "createdAt": data.get("createdAt", 0),
                    "updatedAt": data.get("updatedAt", 0),
                    "favorite": bool(data.get("favorite", False)),
                    "messageCount": len(messages),
                    "preview": next(
                        (
                            (message.get("content") or "")[:120]
                            for message in messages
                            if message.get("role") == "user"
                        ),
                        "",
                    ),
                }
            )

        except (OSError, json.JSONDecodeError, KeyError):
            continue

    sessions.sort(key=lambda item: item["updatedAt"], reverse=True)
    return sessions


async def patch_session(
    session_id: str,
    *,
    title: Optional[str] = None,
    favorite: Optional[bool] = None,
) -> Optional[dict]:
    """
    Update session title/favorite.
    """
    async with _lock_for(session_id):
        data = await get_session(session_id)

        if data is None:
            return None

        if title is not None:
            data["title"] = title.strip()[:120] or data.get("title", "New Conversation")

        if favorite is not None:
            data["favorite"] = bool(favorite)

        data["updatedAt"] = time.time()

        _atomic_write(_path_for(session_id), data)
        return data


async def delete_session(session_id: str) -> bool:
    """
    Delete one session.
    """
    async with _lock_for(session_id):
        path = _path_for(session_id)

        if path.exists():
            path.unlink()
            return True

    return False


async def append_message(session_id: str, message: dict) -> Optional[dict]:
    """
    Append one message to a session.

    Also auto-generates title from first user message.
    """
    async with _lock_for(session_id):
        data = await get_session(session_id)

        if data is None:
            return None

        data.setdefault("messages", []).append(message)
        data["updatedAt"] = time.time()

        if data.get("title") in (None, "", "New Conversation") and message.get("role") == "user":
            first_line = (message.get("content") or "").strip().split("\n", 1)[0]

            if first_line:
                data["title"] = first_line[:60]

        _atomic_write(_path_for(session_id), data)
        return data


async def search(query: str) -> list[dict]:
    """
    Search session title and message bodies.
    """
    needle = (query or "").strip().lower()

    if not needle:
        return await list_sessions()

    results: list[dict] = []

    for path in DATA_DIR.glob("*.json"):
        try:
            with open(path, "r", encoding="utf-8") as file:
                data = json.load(file)

        except (OSError, json.JSONDecodeError):
            continue

        title = (data.get("title") or "").lower()
        messages = data.get("messages", [])

        matched_message = next(
            (
                message.get("content", "")
                for message in messages
                if needle in (message.get("content") or "").lower()
            ),
            None,
        )

        if needle in title or matched_message:
            results.append(
                {
                    "id": data["id"],
                    "title": data.get("title", "New Conversation"),
                    "createdAt": data.get("createdAt", 0),
                    "updatedAt": data.get("updatedAt", 0),
                    "favorite": bool(data.get("favorite", False)),
                    "messageCount": len(messages),
                    "matchSnippet": (matched_message or "")[:160],
                }
            )

    results.sort(key=lambda item: item["updatedAt"], reverse=True)
    return results