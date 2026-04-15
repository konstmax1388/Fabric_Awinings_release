"""Демо-данные для `manage.py seed_demo` (синхронизированы с моками фронта)."""

from datetime import date

PRODUCTS = [
    {
        "slug": "tent-polupricep-20t",
        "title": "Тент на полуприцеп 20 т",
        "excerpt": "ПВХ 900 г/м², люверсы, усиленные швы. Под типовые рамы.",
        "description": (
            "Изделие для стандартных полуприцепов с кривой крыши. Материал ПВХ 900 г/м², "
            "устойчив к морозу и УФ. По периметру люверсы шагом 30 см, усиление в зонах натяжения."
        ),
        "category": "truck",
        "price_from": 42000,
        "show_on_home": True,
        "teasers": ["bestseller", "recommended"],
        "marketplace_links": {
            "wb": "https://www.wildberries.ru/catalog/0/search.aspx?search=тент%20полуприцеп",
            "ozon": "https://www.ozon.ru/search/?text=тент%20фура",
        },
        "sort_order": 10,
        "images": [
            "https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=1200&q=80",
            "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80",
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80",
        ],
    },
    {
        "slug": "tent-fura-tentovannyj",
        "title": "Тент тентованный на фуру",
        "excerpt": "Сдвижной тент, ремонт и замена полотна.",
        "description": (
            "Ремонт и изготовление сдвижных тентов для тентованных фур. Подбор цвета и плотности ПВХ."
        ),
        "category": "truck",
        "price_from": 38000,
        "show_on_home": False,
        "teasers": ["new"],
        "marketplace_links": {"ym": "https://market.yandex.ru/search?text=тент%20фура"},
        "sort_order": 20,
        "images": [
            "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
            "https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=1200&q=80",
        ],
    },
    {
        "slug": "naves-sklad-400",
        "title": "Навес складской каркасный",
        "excerpt": "До 400 м², модульная сборка, ПВХ или ткань.",
        "description": "Каркас из оцинкованного профиля, натяжное полотно. Проект и монтаж под ключ.",
        "category": "warehouse",
        "price_from": 890000,
        "show_on_home": False,
        "teasers": ["recommended"],
        "marketplace_links": {"avito": "https://www.avito.ru/moskva?q=навес%20склад"},
        "sort_order": 30,
        "images": [
            "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
            "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80",
        ],
    },
    {
        "slug": "angar-bystrovozvodimyj",
        "title": "Быстровозводимый ангар",
        "excerpt": "Тентовый ангар под технику и хранение.",
        "description": "Быстрый монтаж без капитального фундамента. Высота и пролёт по заданию.",
        "category": "warehouse",
        "price_from": 1200000,
        "show_on_home": False,
        "teasers": [],
        "marketplace_links": {},
        "sort_order": 40,
        "images": [
            "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&q=80",
            "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
        ],
    },
    {
        "slug": "terassa-kafe-razdvizhnaya",
        "title": "Терраса для кафе, раздвижная",
        "excerpt": "Акрил или ПВХ, каркас алюминий, дренаж.",
        "description": "Коммерческие террасы с раздвижными секциями. Материалы с сертификатами пожарной безопасности.",
        "category": "cafe",
        "price_from": 185000,
        "show_on_home": True,
        "teasers": ["recommended"],
        "marketplace_links": {
            "wb": "https://www.wildberries.ru/",
            "ozon": "https://www.ozon.ru/",
            "ym": "https://market.yandex.ru/",
        },
        "sort_order": 50,
        "images": [
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
        ],
    },
    {
        "slug": "naves-letnij-veranda",
        "title": "Летняя веранда с навесом",
        "excerpt": "Стационарный или сборный вариант.",
        "description": "Навес над зоной посадки гостей, защита от дождя и солнца.",
        "category": "cafe",
        "price_from": 95000,
        "show_on_home": False,
        "teasers": ["bestseller"],
        "marketplace_links": {"avito": "https://www.avito.ru/"},
        "sort_order": 60,
        "images": [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
        ],
    },
    {
        "slug": "shater-meropriyatie-10x15",
        "title": "Шатёр 10×15 м",
        "excerpt": "Выставки, свадьбы, корпоративы.",
        "description": "Сборно-разборный шатёр с боковыми стенами из прозрачного ПВХ или ткани.",
        "category": "events",
        "price_from": 220000,
        "show_on_home": True,
        "teasers": ["new", "recommended"],
        "marketplace_links": {"ozon": "https://www.ozon.ru/"},
        "sort_order": 70,
        "images": [
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
            "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=1200&q=80",
        ],
    },
    {
        "slug": "szena-naves-scenicheskij",
        "title": "Сценический навес",
        "excerpt": "Под сцену и зону зрителей.",
        "description": "Усиленный каркас, расчёт ветровых нагрузок. Обшивка по согласованию.",
        "category": "events",
        "price_from": 450000,
        "show_on_home": False,
        "teasers": [],
        "marketplace_links": {},
        "sort_order": 80,
        "images": [
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
        ],
    },
    {
        "slug": "tent-pickup",
        "title": "Тент на пикап / раму",
        "excerpt": "По размерам кузова, выездной замер или по чертежу.",
        "description": "Индивидуальный раскрой под вашу модель. Крепления под тентовые дуги или люверсы.",
        "category": "truck",
        "price_from": 28000,
        "show_on_home": True,
        "teasers": ["new"],
        "marketplace_links": {"wb": "https://www.wildberries.ru/"},
        "sort_order": 90,
        "images": [
            "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80",
            "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
        ],
    },
    {
        "slug": "ukrytie-strojploshadka",
        "title": "Укрытие строительной площадки",
        "excerpt": "Временный тент от осадков.",
        "description": "Быстрое развёртывание, якорение к балласту.",
        "category": "warehouse",
        "price_from": 156000,
        "show_on_home": False,
        "teasers": [],
        "marketplace_links": {"avito": "https://www.avito.ru/moskva?q=тент%20стройка"},
        "sort_order": 100,
        "images": [
            "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80",
            "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&q=80",
        ],
    },
    {
        "slug": "markiza-vitrina",
        "title": "Маркиза для витрины",
        "excerpt": "Компактный выдвижной навес.",
        "description": "Защита витрины и посетителей от прямого солнца. Электропривод опционально.",
        "category": "cafe",
        "price_from": 62000,
        "show_on_home": False,
        "teasers": ["recommended", "new"],
        "marketplace_links": {
            "ym": "https://market.yandex.ru/",
            "ozon": "https://www.ozon.ru/",
        },
        "sort_order": 110,
        "images": [
            "https://images.unsplash.com/photo-1559327164-6d3a35fdbc8c?w=1200&q=80",
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
        ],
    },
    {
        "slug": "palatka-promo",
        "title": "Промо-палатка 3×3",
        "excerpt": "Брендирование, быстрая установка.",
        "description": "Каркас алюминий, ткань с печатью логотипа. Комплект с сумкой для транспортировки.",
        "category": "events",
        "price_from": 18500,
        "show_on_home": True,
        "teasers": ["bestseller"],
        "marketplace_links": {
            "wb": "https://www.wildberries.ru/",
            "ozon": "https://www.ozon.ru/",
            "ym": "https://market.yandex.ru/",
            "avito": "https://www.avito.ru/",
        },
        "sort_order": 120,
        "images": [
            "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1200&q=80",
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
        ],
    },
]

PORTFOLIO = [
    {
        "slug": "portfolio-fura-20t",
        "title": "Тент на фуру 20 т",
        "category": "Транспорт",
        "before_image": "https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=400&q=80",
        "after_image": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80",
        "completed_on": date(2025, 3, 12),
        "sort_order": 1,
    },
    {
        "slug": "portfolio-sklad",
        "title": "Навес для склада",
        "category": "Склады",
        "before_image": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80",
        "after_image": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80",
        "completed_on": date(2025, 2, 2),
        "sort_order": 2,
    },
    {
        "slug": "portfolio-terassa-kafe",
        "title": "Терраса кафе",
        "category": "Террасы",
        "before_image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
        "after_image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
        "completed_on": date(2025, 1, 18),
        "sort_order": 3,
    },
]

REVIEWS = [
    {
        "name": "Игорь С.",
        "text": "Заказывали тент на полуприцеп. Сроки выдержали, качество швов отличное — через зиму всё ок.",
        "rating": 5,
        "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&q=80",
        "video_url": "",
        "sort_order": 1,
    },
    {
        "name": "ООО «Логистик»",
        "text": "Навес для площадки 400 м². Документы для бухгалтерии, монтаж без простоя погрузки.",
        "rating": 5,
        "photo_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&q=80",
        "video_url": "",
        "sort_order": 2,
    },
    {
        "name": "Анна М.",
        "text": "Терраса для кофейни — красиво и не шумно в дождь. Гости отмечают.",
        "rating": 5,
        "photo_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&q=80",
        "video_url": "",
        "sort_order": 3,
    },
    {
        "name": "Дмитрий К.",
        "text": "Тент на раму для пикапа — сделали по фото и размерам кузова, приехал без второго рейса. Рекомендую.",
        "rating": 5,
        "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80",
        "video_url": "",
        "sort_order": 4,
    },
    {
        "name": "ИП «СтройПлюс»",
        "text": "Временный ангар на объекте: согласовали КП за день, через неделю уже стоял каркас с полотном.",
        "rating": 5,
        "photo_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&q=80",
        "video_url": "",
        "sort_order": 5,
    },
    {
        "name": "Елена В.",
        "text": "Навес у частного дома — аккуратный монтаж, не испортили плитку на террасе. Цена как в смете.",
        "rating": 5,
        "photo_url": "https://images.unsplash.com/photo-1544005313-94ddf0286ad2?w=160&q=80",
        "video_url": "",
        "sort_order": 6,
    },
    {
        "name": "Сергей П.",
        "text": "Срочно восстановили полотно после порыва ветра. Выехали на следующий день, за выходные закрыли объект.",
        "rating": 5,
        "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80",
        "video_url": "",
        "sort_order": 7,
    },
    {
        "name": "Мария Л.",
        "text": "Отправила замеры по чек-листу с сайта — прислали коммерческое без выезда. Потом уже приехали на финальный замер.",
        "rating": 5,
        "photo_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a21a?w=160&q=80",
        "video_url": "",
        "sort_order": 8,
    },
]

BLOG_POSTS = [
    {
        "slug": "kak-vybrat-material",
        "title": "Как выбрать материал для тента: ПВХ или ткань",
        "excerpt": "Сравниваем срок службы, уход и применение для транспорта и стационарных навесов.",
        "body": (
            "<p>ПВХ и ткань — два основных класса материалов. Для транспорта чаще выбирают ПВХ "
            "с плотностью от 650 г/м²: он переносит механические нагрузки и влагу.</p>"
            "<p>Тканевые решения дают более «мягкий» внешний вид и подходят для террас и шатров.</p>"
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
        "published_at": date(2026, 3, 28),
    },
    {
        "slug": "zamer-svoimi-rukami",
        "title": "Замер тента своими руками: чек-лист",
        "excerpt": "Что снять с объекта, чтобы мы подготовили КП без выезда.",
        "body": (
            "<p>Сфотографируйте раму или площадку с нескольких ракурсов, укажите расстояния между "
            "опорными точками и высоту до препятствий.</p>"
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
        "published_at": date(2026, 3, 15),
    },
    {
        "slug": "ustanovka-zimoj",
        "title": "Монтаж зимой: когда это возможно",
        "excerpt": "Температура, ветер и крепления — что учитываем при зимнем монтаже.",
        "body": (
            "<p>Работы возможны при температуре выше −15 °C и отсутствии гололёда на кровле. "
            "Крепления подбираем с запасом по ветровой зоне.</p>"
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=600&q=80",
        "published_at": date(2026, 3, 2),
    },
]
