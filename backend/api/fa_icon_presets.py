"""
Пресеты Font Awesome 6 Free (solid) для блока «Проблема — решение» в админке.
Полный каталог: https://fontawesome.com/search?o=r&m=free
"""

from __future__ import annotations

from django.utils.translation import gettext_lazy as _

# (class_string, label) — только классы из free «solid» (кроме brands).
FONTAWESOME_PRESET_CHOICES: tuple[tuple[str, object], ...] = (
    ("", _("— Выберите из списка или укажите класс вручную ниже —")),
    ("fa-solid fa-coins", _("Монеты / цена")),
    ("fa-solid fa-tag", _("Ценник")),
    ("fa-solid fa-percent", _("Процент")),
    ("fa-solid fa-clock", _("Часы / срок")),
    ("fa-solid fa-truck-fast", _("Доставка / быстро")),
    ("fa-solid fa-calendar-check", _("Календарь / срок")),
    ("fa-solid fa-shield-halved", _("Защита / гарантия")),
    ("fa-solid fa-circle-check", _("Галочка в круге")),
    ("fa-solid fa-thumbs-up", _("Надёжность")),
    ("fa-solid fa-handshake", _("Договор / партнёрство")),
    ("fa-solid fa-file-contract", _("Документ / договор")),
    ("fa-solid fa-ruler-combined", _("Замер / размеры")),
    ("fa-solid fa-tape", _("Рулетка")),
    ("fa-solid fa-helmet-safety", _("Стройка / монтаж")),
    ("fa-solid fa-screwdriver-wrench", _("Сервис / ремонт")),
    ("fa-solid fa-warehouse", _("Склад / производство")),
    ("fa-solid fa-industry", _("Производство")),
    ("fa-solid fa-users", _("Команда")),
    ("fa-solid fa-headset", _("Поддержка")),
    ("fa-solid fa-phone", _("Телефон")),
    ("fa-solid fa-envelope", _("Почта")),
    ("fa-solid fa-location-dot", _("Адрес")),
    ("fa-solid fa-sun", _("Улица / навес")),
    ("fa-solid fa-umbrella", _("Тент / навес")),
    ("fa-solid fa-house", _("Объект / дом")),
    ("fa-solid fa-cart-shopping", _("Заказ")),
    ("fa-solid fa-star", _("Качество")),
    ("fa-solid fa-award", _("Награда")),
    ("fa-solid fa-leaf", _("Материалы / экология")),
    ("fa-solid fa-droplet", _("Вода / ПВХ")),
    ("fa-solid fa-fire", _("Прочность")),
    ("fa-solid fa-lightbulb", _("Идея")),
    ("fa-solid fa-circle-question", _("Вопрос")),
    ("fa-solid fa-comments", _("Диалог")),
)

PRESET_CLASS_SET: frozenset[str] = frozenset(
    c for c, _ in FONTAWESOME_PRESET_CHOICES if c
)
