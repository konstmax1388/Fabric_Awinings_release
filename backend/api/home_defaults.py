"""Тексты и структура главной по умолчанию (мердж с записью из админки)."""

from __future__ import annotations

import re
from copy import deepcopy
from typing import Any

from .home_hero_v2 import default_hero_v2_block, ensure_hero_v2


def default_home_payload() -> dict[str, Any]:
    return {
        "meta": {
            "title": "Фабрика Тентов — тенты, навесы, шатры",
            "description": (
                "Изготовление и монтаж тентов для транспорта, складов, кафе и мероприятий. "
                "Каталог, конструктор тента, заявка онлайн."
            ),
            "orgName": "Фабрика Тентов",
            "orgDescription": "Тенты, навесы, шатры и террасы под ключ.",
        },
        "hero": default_hero_v2_block(),
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
                    "problem": "Есть в наличии?",
                    "solution": "Основные материалы и фурнитура в наличии, запускаем работы без долгого ожидания.",
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
        "processTimeline": {
            "heading": "От замера до монтажа",
            "subheading": "Прозрачный процесс: вы всегда понимаете, на каком этапе проект.",
            "steps": [
                {"title": "Заявка и консультация", "text": "Уточняем задачу, сроки и бюджет."},
                {"title": "Замер и проект", "text": "Фиксируем размеры, материалы и конструктив."},
                {"title": "Изготовление", "text": "Производим и проверяем каждый узел."},
                {"title": "Монтаж и сдача", "text": "Устанавливаем, тестируем, передаём объект."},
            ],
        },
        "purchasePaths": {
            "eyebrow": "Как оформить заказ",
            "heading": "Два понятных сценария: купить готовое или заказать индивидуальный проект",
            "subheading": (
                "Выберите формат работы: быстрое оформление готовых позиций из каталога или персональный "
                "проект с расчётом, замером и изготовлением под вашу задачу."
            ),
            "readyTitle": "Готовая продукция",
            "readySubtitle": "Выбрать из каталога и купить",
            "readyBullets": [
                "Понятные карточки товаров с ценой и параметрами",
                "Добавление в корзину и стандартное оформление заказа",
                "Подходит, когда нужно быстро и без индивидуальной разработки",
            ],
            "readyCta": "Перейти в каталог",
            "readyHref": "/catalog",
            "customTitle": "Индивидуальный проект",
            "customSubtitle": "Оставить заявку на расчёт и замер",
            "customBullets": [
                "Менеджер связывается, уточняет задачу и требования",
                "Делаем расчёт, согласуем материалы, сроки и бюджет",
                "При необходимости выезжаем на замер и изготавливаем под ваш объект",
            ],
            "customCta": "Оставить заявку на проект",
            "customHref": "/#calculator",
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
            "mode": "calculator",
            "heading": "Конструктор тента",
            "subheading": (
                "Подберите параметры тента и получите предварительную стоимость. "
                "Точную цену подтвердим после уточнения деталей."
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
            "submitButton": "Отправить параметры",
            "submitting": "Отправка…",
            "successMessage": (
                "Спасибо! Параметры отправлены. Перезвоним в рабочее время и уточним детали."
            ),
            "requestFormTitle": "Индивидуальный проект под вашу задачу",
            "requestFormSubtitle": (
                "Опишите объект и пожелания. Менеджер свяжется, сделает расчёт, согласует материалы и при необходимости "
                "организует замер."
            ),
            "requestFormBenefit1": "Персональный расчёт под ваш проект",
            "requestFormBenefit2": "Подбор материалов и конструктивных решений",
            "requestFormBenefit3": "Выезд на замер и сопровождение до монтажа",
            "step1Title": "1. Форма и материал",
            "step2Title": "2. Размер и масштаб",
            "virtualRulerTitle": "Виртуальная рулетка",
            "requestBadge": "Индивидуальный проект",
            "errorPhoneIncomplete": "Введите полный номер телефона",
            "errorCommentTooLong": "Комментарий не длиннее {max} символов",
            "errorSubmitFailed": "Не удалось отправить. Позвоните нам или напишите на почту.",
            "errorNetwork": "Ошибка сети. Попробуйте позже.",
            "consentPrefix": "Нажимая кнопку, вы соглашаетесь с",
            "consentPrivacyLinkLabel": "политикой конфиденциальности",
            "consentAndLabel": "и",
            "consentOfferLinkLabel": "публичной офертой",
            "pricingModel": "area_plus_options",
            "lengthMinM": 1.0,
            "lengthMaxM": 30.0,
            "widthMinM": 1.0,
            "widthMaxM": 20.0,
            "minimumTotalRub": 0,
            "roundingStep": 1,
            "materials": [
                {"id": "pvc", "label": "ПВХ 650 г/м²", "pricePerM2": 3200},
                {"id": "canvas", "label": "Ткань акрил", "pricePerM2": 4100},
                {"id": "mesh", "label": "Сетка теневая", "pricePerM2": 2800},
            ],
            "options": [
                {"id": "eyelets", "label": "Люверсы по периметру", "price": 1200},
                {"id": "seams", "label": "Усиленные швы", "price": 2500},
                {"id": "pockets", "label": "Карманы под стойки", "price": 1800},
            ],
        },
        "portfolio": {
            "heading": "Портфолио",
            "subheading": "Реальные объекты: до и после. Полная галерея — в разделе портфолио.",
            "pageHeading": "Портфолио",
            "pageSubheading": "Реализованные проекты",
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
            "readMoreLabel": "Читать весь отзыв",
            "collapseLabel": "Свернуть отзыв",
            "formHeading": "Оставить отзыв",
            "formSubheading": "Публикуем только после проверки менеджером и подтверждения согласия.",
            "namePlaceholder": "Имя",
            "cityPlaceholder": "Город",
            "textPlaceholder": "Текст отзыва",
            "consentPrefix": "Согласен на публикацию отзыва и обработку персональных данных согласно",
            "consentLinkLabel": "политике конфиденциальности",
            "submitButton": "Отправить отзыв",
            "submitting": "Отправка...",
            "successMessage": "Спасибо! Отзыв получен и отправлен менеджеру на модерацию.",
            "errorMessage": "Не удалось отправить отзыв. Проверьте поля и попробуйте еще раз.",
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
            "navHome": "Главная",
            "navCatalog": "Каталог",
            "navPortfolio": "Портфолио",
            "navContacts": "Контакты",
            "navBlog": "Блог",
            "navCart": "Корзина",
            "navAccount": "Личный кабинет",
            "navMenuTitle": "Меню",
            "navMenuSubtitle": "Разделы сайта и контакты",
            "mobileBarProfile": "Профиль",
            "footerNavTitle": "Навигация",
            "footerMarketplacesTitle": "Маркетплейсы",
            "footerSocialTitle": "Соцсети",
            "footerContactsTitle": "Контакты",
            "footerPaymentTitle": "Оплата",
            "footerDeliveryTitle": "Доставка",
            "footerStaffLogin": "Вход для сотрудников",
            "footerPrivacyLink": "Политика конфиденциальности",
            "footerOfferLink": "Публичная оферта",
            "footerCopyrightSuffix": "Все права защищены.",
            "headerMainMenuAria": "Основное меню",
            "headerThemeToLightAria": "Включить светлую тему",
            "headerThemeToDarkAria": "Включить тёмную тему",
            "headerThemeLightTitle": "Светлая тема",
            "headerThemeDarkTitle": "Тёмная тема",
            "headerMenuOpenAria": "Открыть меню",
            "headerMenuCloseAria": "Закрыть меню",
            "headerMobileMenuAria": "Мобильное меню",
            "headerBottomNavAria": "Нижняя навигация",
            "staffModalCloseOverlayAria": "Закрыть окно",
            "staffModalCloseButtonAria": "Закрыть",
            "staffModalTitle": "Вход для сотрудников",
            "staffModalSubtitle": "Выберите панель — откроется в новой вкладке.",
            "staffModalManagerLabel": "Панель менеджера",
            "staffModalManagerHint": "(Каталог, заказы, контент)",
            "staffModalAdminLabel": "Настройки сайта",
            "staffModalAdminHint": "Полный доступ к моделям и сервисным страницам",
            "introAriaLabel": "Загрузка сайта",
            "introTag1": "Чертеж",
            "introTag2": "Точки крепления",
            "introTag3": "Премиум ПВХ",
            "introTitle": "Фабрика Тентов",
            "introSubtitle": "Инженерная геометрия. Премиальная ткань. Точная посадка.",
            "introStage1": "Строим техно-схему",
            "introStage2": "Собираем каркас и узлы",
            "introStage3": "Натягиваем полотно и фиксируем",
            "introSkipButton": "Пропустить",
            "productNoPhoto": "Нет фото",
            "productPricePrefix": "Цена",
            "productAddToCart": "В корзину",
            "productAddedTitle": "Товар добавлен в корзину",
            "productContinueShopping": "Продолжить покупки",
            "productGoToCart": "Перейти в корзину",
            "productMarketplacesTitle": "На маркетплейсах",
            "productBadgeInStock": "Всё в наличии",
            "productBadgeSeasonal": "Сезонное предложение",
            "cartPageTitle": "Корзина",
            "cartPageIntro": (
                "Здесь только выбранные позиции. Ориентировочная сумма по ценам из каталога; "
                "точную стоимость согласуем после замера или по вашим размерам."
            ),
            "cartEmptyTitle": "В корзине пока пусто",
            "cartEmptyText": "Перейдите в каталог и добавьте тенты или навесы — кнопка «В корзину» на карточке товара.",
            "cartEmptyCta": "Перейти в каталог",
            "cartItemsTitle": "Товары",
            "cartNoPhoto": "Нет фото",
            "cartPricePerUnitPrefix": "Цена в каталоге —",
            "cartPricePerUnitSuffix": "за единицу",
            "cartQtyLabel": "Количество",
            "cartRemoveOrDecreaseAria": "Удалить позицию из корзины или уменьшить количество",
            "cartIncreaseAria": "Увеличить количество",
            "cartRemoveLine": "Убрать из корзины",
            "cartAddMoreCta": "← Добавить ещё из каталога",
            "cartSummaryTitle": "Итого",
            "cartSummaryItemsLabel": "Позиций в заказе",
            "cartSummaryApproxLabel": "Ориентировочно",
            "cartSummaryDeliveryNote": "Итоговая сумма появится после выбора и расчета доставки.",
            "cartCheckoutButton": "Оформить заказ",
            "cartCheckoutFootnote": "Далее — контакты и адрес доставки, без онлайн-оплаты на сайте.",
            "cartTermsPrefix": "Оформление заказа регулируется",
            "productNotFoundTitle": "Товар не найден",
            "productNotFoundText": "Позиция отсутствует в каталоге или ссылка устарела.",
            "productBackToCatalog": "В каталог",
            "productBreadcrumbAria": "Навигация",
            "productBreadcrumbHome": "Главная",
            "productBreadcrumbCatalog": "Каталог",
            "productPriceLabel": "Цена",
            "productVariantLabel": "Вариант",
            "productDetailsButton": "Характеристики и описание",
            "productMarketplacesCardTitle": "Маркетплейсы",
            "productMarketplacesCardHint": "Переход к покупке на выбранной площадке — в новой вкладке.",
            "productCustomOrderCta": "Нужен индивидуальный заказ?",
            "productRelatedTitle": "Похожие позиции",
            "productRelatedSubtitlePrefix": "Та же категория:",
            "productMaterialMapSubtitleFallback": "Тапните по точке, чтобы увидеть слой конструкции.",
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


def _calc_safe_id(raw: str, fallback: str) -> str:
    s = (raw or "").strip().lower()
    s = re.sub(r"[^a-z0-9_-]+", "-", s).strip("-")
    if not s or len(s) > 48:
        return fallback
    return s


def _normalize_calculator(home: dict[str, Any]) -> None:
    calc = home.get("calculator")
    defaults = default_home_payload()["calculator"]
    if not isinstance(calc, dict):
        home["calculator"] = deepcopy(defaults)
        return
    if calc.get("pricingModel") not in ("area_plus_options", "area_only", "options_only"):
        calc["pricingModel"] = "area_plus_options"
    for key, fb in (
        ("lengthMinM", defaults["lengthMinM"]),
        ("lengthMaxM", defaults["lengthMaxM"]),
        ("widthMinM", defaults["widthMinM"]),
        ("widthMaxM", defaults["widthMaxM"]),
        ("minimumTotalRub", defaults["minimumTotalRub"]),
        ("roundingStep", defaults["roundingStep"]),
    ):
        try:
            v = float(calc[key]) if "M" in key else int(calc[key])
        except (TypeError, ValueError, KeyError):
            v = fb
        if "M" in key:
            calc[key] = max(0.1, float(v))
        elif key == "roundingStep":
            step = int(v)
            calc[key] = step if step in (1, 10, 50, 100, 500, 1000) else int(defaults["roundingStep"])
        else:
            calc[key] = max(0, int(v))
    mats = calc.get("materials")
    cleaned_m: list[dict[str, Any]] = []
    if isinstance(mats, list):
        for idx, m in enumerate(mats):
            if not isinstance(m, dict):
                continue
            label = str(m.get("label", "")).strip()
            try:
                ppm = int(m.get("pricePerM2", 0))
            except (TypeError, ValueError):
                ppm = 0
            if label and ppm > 0:
                mid = _calc_safe_id(str(m.get("id", "")).strip(), f"mat{idx}")
                cleaned_m.append({"id": mid, "label": label, "pricePerM2": ppm})
    if not cleaned_m:
        calc["materials"] = deepcopy(defaults["materials"])
    else:
        calc["materials"] = cleaned_m
    opts = calc.get("options")
    cleaned_o: list[dict[str, Any]] = []
    if isinstance(opts, list):
        for idx, o in enumerate(opts):
            if not isinstance(o, dict):
                continue
            label = str(o.get("label", "")).strip()
            try:
                pr = int(o.get("price", 0))
            except (TypeError, ValueError):
                pr = 0
            if label and pr >= 0:
                oid = _calc_safe_id(str(o.get("id", "")).strip(), f"opt{idx}")
                cleaned_o.append({"id": oid, "label": label, "price": pr})
    if not cleaned_o:
        calc["options"] = deepcopy(defaults["options"])
    else:
        calc["options"] = cleaned_o
    try:
        if float(calc["lengthMinM"]) >= float(calc["lengthMaxM"]):
            calc["lengthMinM"], calc["lengthMaxM"] = defaults["lengthMinM"], defaults["lengthMaxM"]
    except (TypeError, ValueError):
        calc["lengthMinM"], calc["lengthMaxM"] = defaults["lengthMinM"], defaults["lengthMaxM"]
    try:
        if float(calc["widthMinM"]) >= float(calc["widthMaxM"]):
            calc["widthMinM"], calc["widthMaxM"] = defaults["widthMinM"], defaults["widthMaxM"]
    except (TypeError, ValueError):
        calc["widthMinM"], calc["widthMaxM"] = defaults["widthMinM"], defaults["widthMaxM"]


def _normalize_hero_v2(home: dict[str, Any]) -> None:
    hero = home.get("hero")
    if not isinstance(hero, dict):
        return
    ensure_hero_v2(hero)
    slides = hero.get("slides")
    if not isinstance(slides, list):
        return
    for slide in slides:
        if not isinstance(slide, dict):
            continue
        if slide.get("uspAccentVariant") not in ("pulse", "shimmer"):
            slide["uspAccentVariant"] = "pulse"
        t = slide.get("textTone")
        if t not in ("light", "dark"):
            slide["textTone"] = "light"


def merged_home_payload(stored: dict[str, Any] | None) -> dict[str, Any]:
    out = deep_merge_home(default_home_payload(), stored)
    _normalize_problem_solution_cards(out)
    _normalize_hero_v2(out)
    _normalize_calculator(out)
    return out


def stored_home_payload(stored: dict[str, Any] | None) -> dict[str, Any]:
    """Только сохранённый JSON из админки (без подмешивания дефолтов)."""
    out = deepcopy(stored) if isinstance(stored, dict) else {}
    _normalize_problem_solution_cards(out)
    _normalize_hero_v2(out)
    _normalize_calculator(out)
    return out
