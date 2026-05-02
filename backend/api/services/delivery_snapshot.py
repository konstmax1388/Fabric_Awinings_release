"""Ограничение произвольного JSON доставки с витрины (размер и ключи)."""

from __future__ import annotations

from typing import Any

_ALLOWED_TOP = frozenset({"city", "address", "comment", "cdek", "pickup", "ozonLogistics"})


def _sanitize_jsonish(
    value: Any,
    *,
    max_depth: int,
    max_list: int,
    max_dict_items: int,
    max_str: int,
) -> Any:
    """Рекурсивно режем глубину/размер для произвольного JSON (напр. sellerCheckout Ozon)."""
    if max_depth <= 0:
        return None
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        if isinstance(value, float) and value != value:  # NaN
            return None
        return value
    if isinstance(value, str):
        s = value.strip()
        return s[:max_str] if s else ""
    if isinstance(value, list):
        out_l: list[Any] = []
        for x in value[:max_list]:
            y = _sanitize_jsonish(
                x,
                max_depth=max_depth - 1,
                max_list=max_list,
                max_dict_items=max_dict_items,
                max_str=max_str,
            )
            if y is not None:
                out_l.append(y)
        return out_l
    if isinstance(value, dict):
        out_d: dict[str, Any] = {}
        for i, (ik, iv) in enumerate(value.items()):
            if i >= max_dict_items:
                break
            sk = str(ik)[:80]
            y = _sanitize_jsonish(
                iv,
                max_depth=max_depth - 1,
                max_list=max_list,
                max_dict_items=max_dict_items,
                max_str=max_str,
            )
            if y is not None:
                out_d[sk] = y
        return out_d
    return None


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
            if k == "ozonLogistics":
                cleaned = _sanitize_jsonish(
                    v,
                    max_depth=10,
                    max_list=120,
                    max_dict_items=80,
                    max_str=8000,
                )
                if isinstance(cleaned, dict):
                    out[k] = cleaned
            else:
                inner: dict[str, Any] = {}
                for ik, iv in list(v.items())[:40]:
                    sk = str(ik)[:80]
                    if isinstance(iv, str):
                        inner[sk] = iv.strip()[:2000]
                    elif isinstance(iv, (int, float, bool)):
                        inner[sk] = iv
                out[k] = inner
    return out
