"""Запрос отзывов о товарах через Partner API Яндекс.Маркета (POST goods-feedback)."""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any

logger = logging.getLogger(__name__)

PARTNER_API_BASE = "https://api.partner.market.yandex.ru"


def _feedback_text(description: dict[str, Any] | None) -> str:
    if not isinstance(description, dict):
        return ""
    parts: list[str] = []
    for key in ("comment", "advantages", "disadvantages"):
        raw = description.get(key)
        if isinstance(raw, str) and raw.strip():
            parts.append(raw.strip())
    return "\n\n".join(parts)


def _normalize_photo_url(url: str) -> str:
    u = (url or "").strip()
    if not u:
        return ""
    if u.startswith("//"):
        return f"https:{u}"
    return u


def normalize_goods_feedback_item(row: dict[str, Any]) -> dict[str, Any] | None:
    if not isinstance(row, dict):
        return None
    fid = row.get("feedbackId")
    if fid is None:
        return None
    stats = row.get("statistics") if isinstance(row.get("statistics"), dict) else {}
    rating = stats.get("rating")
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        rating = 0
    author = row.get("author")
    if not isinstance(author, str) or not author.strip():
        author = "Покупатель"
    else:
        author = author.strip()
    created_at = row.get("createdAt")
    created_str = created_at if isinstance(created_at, str) else ""
    identifiers = row.get("identifiers") if isinstance(row.get("identifiers"), dict) else {}
    offer_id = identifiers.get("offerId")
    offer_str = offer_id if isinstance(offer_id, str) and offer_id.strip() else ""
    media = row.get("media") if isinstance(row.get("media"), dict) else {}
    photos_raw = media.get("photos")
    photos: list[str] = []
    if isinstance(photos_raw, list):
        for p in photos_raw:
            if isinstance(p, str):
                u = _normalize_photo_url(p)
                if u:
                    photos.append(u)
    return {
        "id": str(int(fid)) if isinstance(fid, int) else str(fid),
        "author": author,
        "createdAt": created_str,
        "rating": rating,
        "text": _feedback_text(row.get("description") if isinstance(row.get("description"), dict) else None),
        "offerId": offer_str,
        "photos": photos,
    }


def fetch_goods_feedbacks(
    business_id: int,
    api_key: str,
    *,
    limit: int = 20,
    page_token: str | None = None,
    min_rating: int | None = None,
) -> tuple[list[dict[str, Any]], str | None, str | None]:
    """
    Возвращает (items, next_page_token, error_message).
    error_message при сетевой/HTTP ошибке или ответе Маркета не OK.
    """
    body: dict[str, Any] = {"reactionStatus": "ALL"}
    if min_rating is not None:
        try:
            lo = int(min_rating)
        except (TypeError, ValueError):
            lo = 1
        lo = max(1, min(5, lo))
        body["ratingValues"] = list(range(lo, 6))

    q = f"?limit={max(1, min(50, limit))}"
    if page_token and page_token.strip():
        from urllib.parse import quote

        q += f"&pageToken={quote(page_token.strip(), safe='')}"

    url = f"{PARTNER_API_BASE}/v2/businesses/{business_id}/goods-feedback{q}"
    payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Api-Key": api_key.strip(),
            "Accept": "application/json",
        },
    )
    timeout = float((os.environ.get("YANDEX_MARKET_PARTNER_HTTP_TIMEOUT_SEC") or "18").strip() or "18")
    try:
        timeout = max(5.0, min(60.0, timeout))
    except (TypeError, ValueError):
        timeout = 18.0
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode("utf-8", errors="replace")[:500]
        except Exception:
            detail = ""
        logger.warning("Yandex Market goods-feedback HTTP %s: %s", e.code, detail)
        return [], None, f"market_http_{e.code}"
    except urllib.error.URLError as e:
        logger.warning("Yandex Market goods-feedback URL error: %s", e)
        return [], None, "market_network"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return [], None, "market_bad_json"

    if not isinstance(data, dict):
        return [], None, "market_bad_shape"

    status = data.get("status")
    if status != "OK":
        errors = data.get("errors")
        logger.warning("Yandex Market goods-feedback status=%s errors=%s", status, errors)
        return [], None, "market_api_error"

    result = data.get("result")
    if not isinstance(result, dict):
        return [], None, "market_no_result"

    feedbacks = result.get("feedbacks")
    rows: list[dict[str, Any]] = []
    if isinstance(feedbacks, list):
        for item in feedbacks:
            if not isinstance(item, dict):
                continue
            norm = normalize_goods_feedback_item(item)
            if norm:
                rows.append(norm)

    paging = result.get("paging")
    next_tok: str | None = None
    if isinstance(paging, dict):
        npt = paging.get("nextPageToken")
        if isinstance(npt, str) and npt.strip():
            next_tok = npt.strip()

    return rows, next_tok, None
