"""Тексты и структура главной по умолчанию (мердж с записью из админки)."""

from __future__ import annotations

from copy import deepcopy
from typing import Any


def default_home_payload() -> dict[str, Any]:
    return {
        "meta": {
            "title": "Фабрика Тентов — тенты, навесы, шатры",
            "description": (
                "Изготовление и монтаж тентов для транспорта, складов, кафе и мероприятий. "
                "Каталог, калькулятор, заявка онлайн."
            ),
            "orgName": "Фабрика Тентов",
            "orgDescription": "Тенты, навесы, шатры и террасы под ключ.",
        },
        "hero": {
            "title": "Тенты на заказ",
            "subtitle": (
                "Любая форма и размер: от навесов для техники до тентов для мероприятий. Своё производство — "
                "сроки и цена под контролем."
            ),
            "ctaPrimary": "Рассчитать стоимость",
            "ctaSecondary": "Смотреть каталог",
            "primaryAction": {"type": "link", "href": ""},
            "secondaryAction": {"type": "link", "href": ""},
            "callbackModal": {
                "title": "Обратный звонок",
                "nameLabel": "Имя",
                "phoneLabel": "Телефон",
                "submitButton": "Заказать звонок",
                "submitting": "Отправка…",
                "successMessage": "Спасибо! Мы перезвоним в рабочее время.",
            },
            "bgImageUrl": "",
        },
        "problemSolution": {
            "heading": "Решаем ваши задачи",
            "subheading": "Частые вопросы клиентов — и как мы на них отвечаем делом, а не обещаниями.",
            "cards": [
                {
                    "problem": "Дорого?",
                    "solution": "Своё производство — на 30% дешевле типовых предложений.",
                    "iconKind": "emoji",
                    "icon": "₽",
                    "fontawesomeClass": "",
                    "iconImageUrl": "",
                },
                {
                    "problem": "Долго ждать?",
                    "solution": "Изготовление от 5 рабочих дней, срочные заказы — по договорённости.",
                    "iconKind": "emoji",
                    "icon": "⏱",
                    "fontawesomeClass": "",
                    "iconImageUrl": "",
                },
                {
                    "problem": "Ненадёжно?",
                    "solution": "Гарантия на материалы и фурнитуру, договор и акты.",
                    "iconKind": "emoji",
                    "icon": "✓",
                    "fontawesomeClass": "",
                    "iconImageUrl": "",
                },
                {
                    "problem": "Сложно с замером?",
                    "solution": "Выезд специалиста или инструкция для самостоятельного замера.",
                    "iconKind": "emoji",
                    "icon": "📐",
                    "fontawesomeClass": "",
                    "iconImageUrl": "",
                },
            ],
        },
        "tentTypes": {
            "heading": "Виды тентов",
            "subheading": (
                "Выберите направление — в каталоге подберём конфигурацию под ваш объект."
            ),
        },
        "featured": {
            "heading": "Подборка на главной",
            "subheading": "Подборка популярных позиций. Полный ассортимент — в каталоге.",
            "catalogCta": "Весь каталог",
        },
        "calculator": {
            "heading": "Калькулятор стоимости",
            "subheading": (
                "Предварительный расчёт по площади и материалу. Точную цену подтвердим после замера. "
                "Заявку обработает менеджер."
            ),
            "lengthLabel": "Длина, м",
            "widthLabel": "Ширина, м",
            "materialLabel": "Материал",
            "optionsLabel": "Опции",
            "estimateLabel": "Ориентировочная стоимость",
            "estimateNote": "Не публичная оферта. Итоговая цена — в коммерческом предложении.",
            "nameLabel": "Имя",
            "phoneLabel": "Телефон",
            "commentLabel": "Комментарий",
            "namePlaceholder": "Как к вам обращаться",
            "phonePlaceholder": "+7",
            "commentPlaceholder": "Объект, сроки",
            "submitButton": "Отправить заявку",
            "submitting": "Отправка…",
            "successMessage": (
                "Спасибо! Заявка принята. Перезвоним в рабочее время и уточним детали расчёта."
            ),
        },
        "portfolio": {
            "heading": "Портфолио",
            "subheading": "Реальные объекты: до и после. Полная галерея — в разделе портфолио.",
            "filters": ["Все", "Транспорт", "Склады", "Террасы"],
            "loading": "Загрузка портфолио…",
            "empty": "Нет проектов в выбранной категории.",
            "allProjectsCta": "Все проекты",
        },
        "whyUs": {
            "heading": "Почему выбирают нас",
            "subheading": "Работаем прозрачно: вы знаете этапы, сроки и ответственных.",
            "stats": [
                {"value": 500, "suffix": "+", "label": "проектов"},
                {"value": 12, "suffix": "+", "label": "лет на рынке"},
                {"value": 50, "suffix": "+", "label": "типов изделий"},
            ],
            "columns": [
                {
                    "title": "Своё производство",
                    "text": "Полный цикл: проектирование, раскрой, сварка и монтаж своими бригадами.",
                    "icon": "🏭",
                },
                {
                    "title": "Материалы в наличии",
                    "text": "ПВХ, ткани, фурнитура от проверенных поставщиков — без месяцев ожидания.",
                    "icon": "📦",
                },
                {
                    "title": "Договор и гарантия",
                    "text": "Фиксируем сроки и объём работ. Документы для B2B и тендеров.",
                    "icon": "📋",
                },
                {
                    "title": "Поддержка после монтажа",
                    "text": "Консультации по уходу, ремонт и доработки по запросу.",
                    "icon": "🛠",
                },
            ],
        },
        "reviews": {
            "heading": "Отзывы клиентов",
            "subheading": "Реальные заказчики B2B и частные лица.",
            "loading": "Загрузка отзывов…",
            "videoCaption": "Видеоотзыв",
        },
        "blog": {
            "heading": "Блог",
            "subheading": "Полезные материалы для заказчиков и эксплуатации тентов.",
            "allLink": "Все статьи →",
            "readMore": "Читать далее",
            "loading": "Загрузка блога…",
        },
        "mapForm": {
            "heading": "Контакты и заявка",
            "subheading": "Оставьте заявку — свяжемся в рабочее время.",
            "mapIframeSrc": (
                "https://yandex.ru/map-widget/v1/?ll=37.620393%2C55.753960&z=16&pt=37.620393%2C55.753960%2Cpm2rdm"
            ),
            "mapTitle": "Карта — расположение производства",
            "formNameLabel": "Имя",
            "formPhoneLabel": "Телефон",
            "formCommentLabel": "Комментарий",
            "namePlaceholder": "Как к вам обращаться",
            "phonePlaceholder": "+7",
            "commentPlaceholder": "Задача, размеры, сроки",
            "submitButton": "Отправить",
        },
        "ui": {
            "loadingFeatured": "Загрузка подборки…",
            "buyOnMarketplaces": "Купить на",
            "buyOnMarketplacesMobile": "Купить на маркетплейсе",
        },
    }


def deep_merge_home(base: dict[str, Any], override: dict[str, Any] | None) -> dict[str, Any]:
    """Рекурсивно дополняет base значениями из override (ветки dict сливаются)."""
    if not override:
        return deepcopy(base)
    out = deepcopy(base)
    for key, val in override.items():
        if key in out and isinstance(out[key], dict) and isinstance(val, dict):
            out[key] = deep_merge_home(out[key], val)
        else:
            out[key] = deepcopy(val) if isinstance(val, dict) else val
    return out


def _normalize_problem_solution_cards(home: dict[str, Any]) -> None:
    ps = home.get("problemSolution")
    if not isinstance(ps, dict):
        return
    cards = ps.get("cards")
    if not isinstance(cards, list):
        return
    for c in cards:
        if not isinstance(c, dict):
            continue
        if c.get("iconKind") not in ("emoji", "fontawesome", "image"):
            c["iconKind"] = "emoji"
        c.setdefault("fontawesomeClass", "")
        c.setdefault("iconImageUrl", "")


def merged_home_payload(stored: dict[str, Any] | None) -> dict[str, Any]:
    out = deep_merge_home(default_home_payload(), stored)
    _normalize_problem_solution_cards(out)
    return out
