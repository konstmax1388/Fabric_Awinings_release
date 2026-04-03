# Беклог

Накопительный список задач по проекту «Фабрика Тентов». Статусы: **TODO** → **IN PROGRESS** → **DONE**. Приоритет: **P0** (блокер) / **P1** / **P2**.

---

## Эпик: Документация и репозиторий

| ID | Задача | Статус | Примечание |
|----|--------|--------|------------|
| D-1 | Зафиксировать ТЗ и дизайн в `docs/` | DONE | Текущее состояние репозитория |
| D-2 | Корневой `README.md` + `BACKLOG.md` | DONE | Этот файл и README в корне |
| D-3 | Первый коммит в Git, ветки `main` / `release` | DONE | Инициализация репозитория в корне проекта |

---

## Эпик: Этап 1 — настройка проекта

| ID | Задача | Статус | Примечание |
|----|--------|--------|------------|
| S1-1 | Инициализация **Vite + React** | DONE | `frontend/`, TypeScript |
| S1-2 | **Tailwind**, шрифты (Google Fonts) | DONE | Tailwind v4 + токены в `index.css` |
| S1-3 | **Django + DRF**, структура API | DONE | `backend/`, `GET /api/health/`, SQLite dev |
| S1-4 | Маршрутизация frontend + CORS/API base URL | DONE | `react-router-dom`, `VITE_API_URL`, `fetchHealth` |
| S1-5 | **Docker Compose** (изолированное имя проекта, порты из `.env`) | DONE | `api` + `frontend`, том `node_modules` |

---

## Эпик: Этап 2 — главная страница

| ID | Задача | Статус | Примечание |
|----|--------|--------|------------|
| H-1 … H-11 | Вёрстка **11 блоков** лендинга по порядку | DONE | `SiteHeader`, `HeroSection` … `MapFormSection`, `SiteFooter`; заглушки страниц `/catalog`, `/portfolio`, `/contacts`, `/blog` |
| H-A | Адаптив **mobile first** | DONE | брейкпоинты `md`/`lg`, бургер-меню, `min-h-[44px]` на CTA |

---

## Эпик: Этап 3 — анимации

| ID | Задача | Статус | Примечание |
|----|--------|--------|------------|
| A-1 | **Framer Motion:** fade-up, scroll, stagger | DONE | `motion-presets.ts`, секции главной |
| A-2 | Hover-карточки, Primary, иконки МП; CTA-пульс; счётчики | DONE | `WhyUsSection` + `AnimatedCounter`, `Hero`/`Header`/`MarketplaceLinks` |
| A-3 | Бургер-трансформация | DONE | `SiteHeader` (`motion.span` + `AnimatePresence`) |

---

## Эпик: Этапы 4–6 — каталог, МП, калькулятор

| ID | Задача | Статус | Примечание |
|----|--------|--------|------------|
| C-1 | Каталог: сетка, фильтры, сортировка, пагинация / infinite scroll | DONE | `CatalogPage`, `catalog-utils`, мок `products.ts` |
| C-2 | Карточка товара: галерея, МП, похожие | DONE | `ProductPage`, `ProductGallery`, `ProductCard` |
| C-3 | Интеграция ссылок МП (футер + товар) | DONE | `GLOBAL_MARKETPLACE_URLS`, `hrefById` / `linkKeys` |
| C-4 | Калькулятор: формула, live-цена, заявка | DONE | `lib/calculator.ts`, `lib/leads.ts`, форма в `PriceCalculatorSection` |

---

## Эпик: Этап 7–8 — backend и админка

| ID | Задача | Статус | Примечание |
|----|--------|--------|------------|
| B-1 | Модели и API: товары, портфолио, отзывы, статьи, заявки, контент главной | TODO | [functional-requirements.md](docs/functional-requirements.md) §2.2 |
| B-2 | **JWT**, роли admin / manager | TODO | |
| B-3 | Админка: React Admin или кастом, полный CRUD | TODO | |

---

## Эпик: Этап 9–10 — SEO и качество

| ID | Задача | Статус | Примечание |
|----|--------|--------|------------|
| SEO-1 | React Helmet, sitemap.xml, robots.txt, микроразметка | TODO | |
| QA-1 | Lighthouse, кроссбраузер, мобилки, багфиксы | TODO | [deliverables-and-acceptance.md](docs/deliverables-and-acceptance.md) §7 |

---

## Открытые вопросы

- Детальный **список анимаций** для макета (если расширится относительно [animations.md](docs/animations.md)) — дополнить и зафиксировать.
- Точная **формула калькулятора** и коэффициенты — в ТЗ/API.
- **Деплой** на хостинг из [requirements.md](docs/requirements.md) §5 — инструкция после появления билда.

---

*Обновляйте таблицы при закрытии задач и добавляйте новые строки по мере появления работ.*
