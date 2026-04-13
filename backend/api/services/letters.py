def _money(n: int) -> str:
    return f"{n:,}".replace(",", " ")


def build_cart_letters(
    order_ref: str,
    customer: dict,
    lines: list[dict],
    total_approx: int,
    delivery: dict | None = None,
) -> tuple[str, str]:
    name = customer.get("name", "").strip()
    phone = customer.get("phone", "").strip()
    email = (customer.get("email") or "").strip()
    comment = (customer.get("comment") or "").strip()
    delivery = delivery or {}

    line_blocks = []
    for line in lines:
        d = dict(line)
        title = d.get("title", "")
        slug = d.get("slug", "")
        qty = int(d.get("qty") or 0)
        unit = int(d.get("priceFrom") or 0)
        row_total = unit * qty
        line_blocks.append(
            f"• {title}\n"
            f"  Ссылка: /catalog/{slug}\n"
            f"  Количество: {qty}\n"
            f"  Цена «от» за ед.: {_money(unit)} ₽\n"
            f"  Сумма по строке: {_money(row_total)} ₽"
        )
    lines_block = "\n\n".join(line_blocks)

    hdr: list[str] = [
        "========== ЗАЯВКА С КОРЗИНЫ САЙТА ==========",
        f"Номер заявки: {order_ref}",
        "",
        "КЛИЕНТ",
        f"Имя: {name}",
        f"Телефон: {phone}",
    ]
    if email:
        hdr.append(f"Email: {email}")
    if comment:
        hdr.append(f"Комментарий: {comment}")
    city = (delivery.get("city") or "").strip()
    addr = (delivery.get("address") or "").strip()
    d_comment = (delivery.get("comment") or "").strip()
    if city or addr or d_comment:
        hdr.append("")
        hdr.append("ДОСТАВКА (черновик)")
        if city:
            hdr.append(f"Город: {city}")
        if addr:
            hdr.append(f"Адрес: {addr}")
        if d_comment:
            hdr.append(f"Комментарий к доставке: {d_comment}")
    hdr.extend(
        [
            "",
            "СОСТАВ ЗАКАЗА",
            lines_block,
            "",
            f"ИТОГО (ориентировочно): {_money(total_approx)} ₽",
            "",
            "Действие: связаться с клиентом, согласовать замер и КП.",
            "===========================================",
        ]
    )
    manager_letter = "\n".join(hdr)

    client_ack = (
        f"Здравствуйте, {name}!\n\n"
        f"Ваш заказ {order_ref} принят.\n\n"
        "Мы получили подробную заявку с составом корзины. Менеджер свяжется с вами в рабочее время.\n"
        f"Сумма {_money(total_approx)} ₽ указана ориентировочно (по ценам «от»); "
        "финальная стоимость — после замера и согласования.\n\n"
        "Спасибо за обращение!"
    )
    return manager_letter, client_ack
