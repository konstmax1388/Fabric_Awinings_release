"""Ограничение произвольного JSON доставки с витрины (размер и ключи)."""

from __future__ import annotations

from typing import Any

_ALLOWED_TOP = frozenset({"city", "address", "comment", "cdek", "pickup", "ozonLogistics"})


def sanitize_checkout_delivery(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        return {}
    out: dict[str, Any] = {}
    for k, v in raw.items():
        if k not in _ALLOWED_TOP:
            continue
        if isinstance(v, str):
            out[k] = v.strip()[:2000]
        elif isinstance(v, dict):
            inner: dict[str, Any] = {}
            for ik, iv in list(v.items())[:40]:
                sk = str(ik)[:80]
                if isinstance(iv, str):
                    inner[sk] = iv.strip()[:2000]
                elif isinstance(iv, (int, float, bool)):
                    inner[sk] = iv
            out[k] = inner
    return out
