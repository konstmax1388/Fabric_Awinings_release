"""Расчёт суммы товаров, доставки и итога при оформлении заказа."""

from __future__ import annotations

from typing import Any

from api.models import CartOrder, Product, ProductVariant, SiteSettings


def goods_subtotal_from_lines(lines: list[dict[str, Any]]) -> int:
    total = 0
    for row in lines:
        if not isinstance(row, dict):
            continue
        try:
            unit = int(row.get("priceFrom") or 0)
            qty = int(row.get("qty") or 0)
        except (TypeError, ValueError):
            continue
        if qty < 1 or unit < 0:
            continue
        total += unit * qty
    return max(0, total)


def build_trusted_checkout_lines(raw_lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Нормализует и валидирует строки корзины по БД.

    Возвращает список строк, где priceFrom/title/slug/IDs взяты из БД.
    Бросает ValueError при любой невалидной строке.
    """
    trusted: list[dict[str, Any]] = []
    for idx, row in enumerate(raw_lines, start=1):
        if not isinstance(row, dict):
            raise ValueError(f"Строка корзины #{idx}: некорректный формат.")
        pid_raw = str(row.get("productId") or "").strip()
        given_slug = str(row.get("slug") or "").strip()
        product: Product | None = None
        if pid_raw.isdigit():
            product = Product.objects.select_related("category").filter(pk=int(pid_raw)).first()
        if product is None and given_slug:
            product = Product.objects.select_related("category").filter(slug=given_slug).first()

        qty = int(row.get("qty") or 0)
        if qty < 1 or qty > 99:
            raise ValueError(f"Строка корзины #{idx}: некорректное количество.")

        if product is None:
            # Legacy fallback для старых корзин: если товар уже недоступен в БД,
            # не блокируем оформление, но сохраняем нормализованную строку.
            out_legacy: dict[str, Any] = {
                "productId": pid_raw,
                "variantId": str(row.get("variantId") or "").strip(),
                "slug": given_slug,
                "title": (str(row.get("title") or "").strip() or "Товар")[:500],
                "priceFrom": max(0, int(row.get("priceFrom") or 0)),
                "qty": qty,
                "image": str(row.get("image") or "").strip()[:2048],
                "ozonSku": row.get("ozonSku"),
                "cdekWeightGrams": row.get("cdekWeightGrams"),
                "cdekLengthCm": row.get("cdekLengthCm"),
                "cdekWidthCm": row.get("cdekWidthCm"),
                "cdekHeightCm": row.get("cdekHeightCm"),
            }
            trusted.append(out_legacy)
            continue

        if not product.is_published or not product.category.is_published:
            raise ValueError(f"Строка корзины #{idx}: товар недоступен для заказа.")
        if given_slug and given_slug != product.slug:
            raise ValueError(f"Строка корзины #{idx}: slug не соответствует productId.")

        variant_id_raw = str(row.get("variantId") or "").strip()
        variant: ProductVariant | None = None
        if variant_id_raw:
            if not variant_id_raw.isdigit():
                raise ValueError(f"Строка корзины #{idx}: некорректный variantId.")
            try:
                variant = ProductVariant.objects.get(pk=int(variant_id_raw), product_id=product.pk)
            except ProductVariant.DoesNotExist as exc:
                raise ValueError(f"Строка корзины #{idx}: вариант не найден.") from exc

        unit_price = int(variant.price_from if variant is not None else product.price_from)
        title = str(product.title or "").strip() or str(row.get("title") or "").strip() or "Товар"
        out: dict[str, Any] = {
            "productId": str(product.pk),
            "variantId": str(variant.pk) if variant is not None else "",
            "slug": product.slug,
            "title": title[:500],
            "priceFrom": max(0, unit_price),
            "qty": qty,
            "image": str(row.get("image") or "").strip()[:2048],
            "ozonSku": row.get("ozonSku"),
            "cdekWeightGrams": row.get("cdekWeightGrams"),
            "cdekLengthCm": row.get("cdekLengthCm"),
            "cdekWidthCm": row.get("cdekWidthCm"),
            "cdekHeightCm": row.get("cdekHeightCm"),
        }
        trusted.append(out)
    return trusted


def quoted_cdek_delivery_rub(delivery: dict[str, Any]) -> int | None:
    cdek = delivery.get("cdek")
    if not isinstance(cdek, dict):
        return None
    raw = cdek.get("deliveryPriceRub")
    if raw is None:
        return None
    try:
        v = int(float(raw))
    except (TypeError, ValueError):
        return None
    if v < 0 or v > 2_000_000:
        return None
    return v


def delivery_charge_rub(
    *,
    delivery_method: str,
    goods_subtotal: int,
    delivery_snapshot: dict[str, Any],
    settings: SiteSettings,
) -> tuple[int, int | None]:
    """
    Возвращает (итоговая стоимость доставки к оплате, исходная котировка до бесплатного порога или None).

    Для самовывоза и Ozon Logistics доставка на сайте считается 0.
    """
    dm = delivery_method
    if dm in (CartOrder.DeliveryMethod.PICKUP, CartOrder.DeliveryMethod.OZON_LOGISTICS):
        return 0, None

    free_from = int(settings.checkout_free_delivery_from_rub or 0)
    if free_from > 0 and goods_subtotal >= free_from:
        q = quoted_cdek_delivery_rub(delivery_snapshot)
        return 0, q

    if dm != CartOrder.DeliveryMethod.CDEK:
        return 0, None

    q = quoted_cdek_delivery_rub(delivery_snapshot)
    if q is None:
        return 0, None
    return q, q


def expected_total_approx(
    goods_subtotal: int,
    delivery_charge: int,
    recipient_fee: int = 0,
) -> int:
    return max(0, goods_subtotal + max(0, delivery_charge) + max(0, recipient_fee))


def cdek_recipient_fee_rub(
    *,
    settings: SiteSettings,
    delivery_method: str,
    payment_method: str,
    goods_subtotal: int,
) -> int:
    if delivery_method != CartOrder.DeliveryMethod.CDEK:
        return 0
    if payment_method != CartOrder.PaymentMethod.COD_CDEK:
        return 0
    mode = str(settings.cdek_recipient_delivery_fee_mode or "").strip().lower()
    if mode == SiteSettings.CdekRecipientDeliveryFeeMode.FIXED:
        return max(0, int(settings.cdek_recipient_delivery_fee_fixed_rub or 0))
    if mode == SiteSettings.CdekRecipientDeliveryFeeMode.PERCENT:
        try:
            pct = float(settings.cdek_recipient_delivery_fee_percent or 0)
        except (TypeError, ValueError):
            pct = 0.0
        base = max(0, int(goods_subtotal or 0))
        return max(0, int(round(base * max(0.0, pct) / 100.0)))
    return 0
