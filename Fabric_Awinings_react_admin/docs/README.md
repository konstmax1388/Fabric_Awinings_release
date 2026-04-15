# Документация проекта Fabric Awnings

Каталог накапливающейся документации по сайту. Требования и решения дополняются по мере согласования.

**Снимок текущего стека, URL и важных решений (для продолжения работ / контекста ИИ):** [project-context.md](./project-context.md).

**Где остановились с React Admin и стеком `Fabric_Awinings_react_admin` (2026-04-14):** [react-admin-handoff-state.md](./react-admin-handoff-state.md).

## Содержание

| Документ | Назначение |
|----------|------------|
| [project-context.md](./project-context.md) | Снимок реализации: backend/frontend, `/cart`, AppShell, команды, ограничения |
| [react-admin-handoff-state.md](./react-admin-handoff-state.md) | **Точка возврата:** порты, URL, исправления (MUI 7, Docker, Unfold vs RA) |
| [staff-permissions-and-roles-roadmap.md](./staff-permissions-and-roles-roadmap.md) | **Запланировано:** гранулярные права staff (каталог/заказы vs полный доступ), Django Admin vs React — реализация с продакшена |
| [bitrix24-ecommerce-plan.md](./bitrix24-ecommerce-plan.md) | **План и требования:** магазин на сайте + Битрикс24, СДЭК, эквайринг, ЛК (без реализации) |
| [astrum-bitrix-crm.md](./astrum-bitrix-crm.md) | **Реализация:** заказы корзины → Astrum «Заявки с сайта» → Б24 (env, тесты, retry) |
| [from-scaffold-to-bitrix.md](./from-scaffold-to-bitrix.md) | Каркас React+Django как «шаблон» vs Битрикс24 / 1С-Битрикс: УС — что совместимо |
| [requirements.md](./requirements.md) | Техническое задание (**ТЗ 2.0**), ограничения, договорённости по процессу |
| [tz-2-0-alignment.md](./tz-2-0-alignment.md) | **ТЗ 2.0:** что изменилось относительно v1, расхождения с кодом |
| [rollout-two-phase-plan.md](./rollout-two-phase-plan.md) | **Два больших этапа:** магазин + Б24 (пошагово), затем импорт товаров (Б24 / WB / Ozon); чек-лист нехватки данных |
| [next-steps.md](./next-steps.md) | **Что делать дальше** после аудита зависимостей и документации |
| [CHANGELOG.md](../CHANGELOG.md) | **Журнал изменений** по версиям (источник версии — файл `VERSION` в корне) |
| [technical-debt.md](./technical-debt.md) | **Технический долг:** известные риски кода (заказы из корзины и др.) |
| [excel-catalog-import.md](./excel-catalog-import.md) | Импорт каталога из таблицы заказчика (`.xlsx`), маппинг колонок |
| [cdek-api-v2.md](./cdek-api-v2.md) | СДЭК API v2: тест/прод URL, OAuth, типовые методы (без секретов) |
| [functional-requirements.md](./functional-requirements.md) | Цели, **frontend**, **админка**, **интеграции** (Б24, СДЭК, эквайринг, МП, …) |
| [typography.md](./typography.md) | Шрифты: Google Fonts, Tailwind, Figma, адаптив Mobile First |
| [design.md](./design.md) | **Дизайн:** бриф (§1) + глобальные стили (§2) |
| [components.md](./components.md) | **Компоненты:** Primary/Secondary/иконка, Input, карточки товара/портфолио/отзыва, иконки МП, бургер |
| [animations.md](./animations.md) | **Анимации (ТЗ §5):** fade-up, stagger, hover, CTA-пульс, счётчики, бургер; реализация Framer Motion |
| [development-phases.md](./development-phases.md) | **Этапы по ТЗ 2.0** (1–12): магазин, ЛК, Б24, СДЭК, эквайринг, Celery, React Admin, SEO, тесты + статус кода |
| [admin-react-admin-migration-analysis.md](./admin-react-admin-migration-analysis.md) | **Спецификация v1.0:** staff-панель на React Admin + `/api/staff/v1/`, нормативные решения, фазы, приёмка, оценка трудозатрат |
| [deliverables-and-acceptance.md](./deliverables-and-acceptance.md) | **Деливераблы** (код, деплой, админка, доки) и **критерии приёмки** (функционал, Lighthouse, анимации, безопасность) |

## Как вести документы

- Новые формулировки из переписки переносятся в **requirements.md** в подходящий раздел.
- После появления отдельных крупных тем (дизайн, API, деплой) при необходимости выделяются отдельные файлы в `docs/` и ссылка добавляется в таблицу выше.
- Разработка frontend в **Docker** (Vite HMR): корневой **[README.md](../README.md)** — `docker compose up`, порт в `.env`.
- Релизы: обновить **`VERSION`** и запись в **[CHANGELOG.md](../CHANGELOG.md)**; при необходимости — тег `git tag -a vX.Y.Z` и `git push origin main --tags`.
