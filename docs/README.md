# Документация проекта Fabric Awinings

Каталог накапливающейся документации по сайту. Требования и решения дополняются по мере согласования.

**Снимок текущего стека, URL и важных решений (для продолжения работ / контекста ИИ):** [project-context.md](./project-context.md).

## Содержание

| Документ | Назначение |
|----------|------------|
| [project-context.md](./project-context.md) | Снимок реализации: backend/frontend, `/cart`, AppShell, команды, ограничения |
| [bitrix24-ecommerce-plan.md](./bitrix24-ecommerce-plan.md) | **План и требования:** магазин на сайте + Битрикс24, СДЭК, эквайринг, ЛК (без реализации) |
| [from-scaffold-to-bitrix.md](./from-scaffold-to-bitrix.md) | Каркас React+Django как «шаблон» vs Битрикс24 / 1С-Битрикс: УС — что совместимо |
| [requirements.md](./requirements.md) | Техническое задание, ограничения, договорённости по процессу |
| [functional-requirements.md](./functional-requirements.md) | Цели, **frontend**, **админка**, **интеграции** (МП, Яндекс Карты, аналитика, email, капча) |
| [typography.md](./typography.md) | Шрифты: Google Fonts, Tailwind, Figma, адаптив Mobile First |
| [design.md](./design.md) | **Дизайн:** бриф (§1) + глобальные стили (§2) |
| [components.md](./components.md) | **Компоненты:** Primary/Secondary/иконка, Input, карточки товара/портфолио/отзыва, иконки МП, бургер |
| [animations.md](./animations.md) | **Анимации (ТЗ §5):** fade-up, stagger, hover, CTA-пульс, счётчики, бургер; реализация Framer Motion |
| [development-phases.md](./development-phases.md) | **Этапы разработки** (1–10): Vite/React, Tailwind, Django/DRF, анимации, каталог, МП, калькулятор, API, админка, SEO, тесты |
| [deliverables-and-acceptance.md](./deliverables-and-acceptance.md) | **Деливераблы** (код, деплой, админка, доки) и **критерии приёмки** (функционал, Lighthouse, анимации, безопасность) |

## Как вести документы

- Новые формулировки из переписки переносятся в **requirements.md** в подходящий раздел.
- После появления отдельных крупных тем (дизайн, API, деплой) при необходимости выделяются отдельные файлы в `docs/` и ссылка добавляется в таблицу выше.
- Разработка frontend в **Docker** (Vite HMR): корневой **[README.md](../README.md)** — `docker compose up`, порт в `.env`.
