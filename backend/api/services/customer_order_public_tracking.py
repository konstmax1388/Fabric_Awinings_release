"""Публичные ссылки для ЛК покупателя (без влияния на чекаут и вебхуки)."""

from urllib.parse import quote

# Раздел «Мои заказы» на ozon.ru (после входа покупатель видит доставки Ozon).
OZON_MY_ORDERS_PUBLIC_URL = "https://www.ozon.ru/my/orderlist"


def cdek_public_tracking_url(tracking: str | None) -> str | None:
    """Ссылка на страницу отслеживания СДЭК с подстановкой номера в query (best-effort)."""
    t = (tracking or "").strip()
    if not t:
        return None
    return f"https://www.cdek.ru/ru/tracking/?order_id={quote(t, safe='')}"
