# Система шрифтов

Спецификация для вёрстки сайта «Фабрика Тентов». Подключение — **Google Fonts**.

**Цвета, скругления, тени и сетка** — в **[design.md](./design.md)**.

## Назначение шрифтов

| Роль | Шрифт | Начертания |
|------|--------|------------|
| Заголовки (H1–H4) | **Playfair Display** | 500, 600, 700, 800, 800 *italic* |
| Текст (body) | **Inter** | 300, 400, 500, 600, 700 |
| Акцидентные цифры (цены, счётчики) | **Playfair Display** (800) **или** **Inter** (700 bold) | 800 / 700 |

## Подключение (Google Fonts)

### CSS (`index.css` или `App.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800;900&family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

:root {
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
}
```

### Tailwind (`tailwind.config.js`)

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
};
```

## Использование в коде (Tailwind)

| Элемент | Классы Tailwind | Шрифт | Размер | Вес | Letter-spacing |
|---------|-----------------|-------|--------|-----|----------------|
| H1 | `font-heading text-5xl lg:text-7xl font-black` | Playfair | 48–64px | 900 | -0.02em |
| H2 | `font-heading text-3xl lg:text-5xl font-bold` | Playfair | 32–48px | 700 | -0.01em |
| H3 | `font-heading text-2xl lg:text-3xl font-semibold` | Playfair | 24–32px | 600 | 0 |
| H4 | `font-heading text-xl lg:text-2xl font-semibold italic` | Playfair | 20–24px | 600 italic | 0 |
| Body large | `font-body text-lg font-normal` | Inter | 18px | 400 | 0 |
| Body | `font-body text-base font-normal` | Inter | 16px | 400 | 0 |
| Small text | `font-body text-sm font-light` | Inter | 14px | 300 | 0 |
| Цена | `font-body text-3xl font-bold text-accent` | Inter | 30px | 700 | -0.01em |
| Кнопки | `font-body text-base font-medium` | Inter | 16px | 500 | 0 |
| Меню | `font-body text-base font-medium` | Inter | 16px | 500 | 0 |
| Цитата / отзыв | `font-heading text-xl italic font-medium` | Playfair | 20px | 500 italic | 0 |

**Примечание:** для курсива Playfair в отзывах и H4 при необходимости расширить `@import` Google Fonts осью `ital` для нужных весов (если браузер не подставит синтетический курсив).

---

## Визуальное сочетание (для дизайнера в Figma)

Ориентиры по **desktop** для макетов. Кернинг в таблице — как **letter spacing** (в Figma: процент от размера шрифта или px, как указано).

| Тип элемента | Шрифт | Размер (desktop) | Кернинг | Пример |
|--------------|-------|------------------|---------|--------|
| Hero H1 | Playfair Display | 64px | -2% | «Тенты на заказ» |
| Hero подзаголовок | Inter | 20px | 0 | «Любая форма, размер...» |
| Заголовки секций | Playfair Display | 48px | -1% | «Почему выбирают нас» |
| Карточки товаров | Playfair (название) + Inter (цена) | 20px / 28px | 0 / -1% | «Тент для грузовика / 12 500 ₽» |
| Кнопки | Inter | 16px (uppercase опционально) | +0.5px | «РАССЧИТАТЬ СТОИМОСТЬ» |
| Цифры (счётчики) | Inter (bold) | 48px | -2% | «500+ проектов» |

Для **вёрстки** межбуквенный интервал кнопок — **`letter-spacing: 0.02em`** ([design.md § 2.2](./design.md#22-шрифты-и-типографика)); значение в Figma (+0.5px) при необходимости согласовать с макетом.

---

## Адаптивные размеры (Mobile First)

**Эталонные пары десктоп / мобильный** (в т.ч. H1–H4, Body Large, Body, Caption, цены, кнопки) — в **[design.md § 2.2](./design.md#22-шрифты-и-типографика)**.

Дополнительный ориентир для **трёх** ступеней (удобно для `md:` / `lg:`), если в макете заданы промежуточные значения:

| Элемент | Mobile (320–768px) | Tablet (768–1024px) | Desktop (1024px+) |
|---------|---------------------|----------------------|-------------------|
| H1 | 36px | 48px | 64px |
| H2 | 28px | 36px | 48px |
| H3 | 22px | 26px | 32px |
| Body | 14px | 15px | 16px |
| Цена | 24px | 28px | 32px |

При конфликте с **design.md § 2.2** приоритет у **design.md**. Вёрстка — утилиты Tailwind (`text-*`, `sm:` / `md:` / `lg:`) или `theme.fontSize`.
