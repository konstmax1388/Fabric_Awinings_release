import type { MarketplaceId } from '../config/site'

/** Слаг категории с бэкенда (?category= в каталоге) */
export type ProductCategory = string

/** Тизеры на карточке (в админке — чекбоксы / теги) */
export type ProductTeaser = 'recommended' | 'bestseller' | 'new'

/** Торговое предложение на карточке (как варианты на WB) */
export type ProductVariantRow = {
  id: string
  label: string
  priceFrom: number
  images: string[]
  wbUrl?: string
  isDefault?: boolean
}

export type ProductSpecificationRow = {
  groupName: string
  name: string
  value: string
}

/** SEO с бэкенда (автогенерация под Яндекс / РФ). */
export type ProductSeo = {
  pageTitle: string
  metaDescription: string
  canonicalPath: string
  canonicalUrl: string
  ogImage: string
  robots: string
}

export const TEASER_LABELS: Record<ProductTeaser, string> = {
  recommended: 'Рекомендуем',
  bestseller: 'Хит продаж',
  new: 'Новинка',
}

export type Product = {
  id: string
  slug: string
  title: string
  excerpt: string
  description: string
  category: ProductCategory
  /** Подпись категории с API (для карточки товара) */
  categoryTitle?: string
  images: string[]
  /** Цена в каталоге, ₽ — для сортировки и карточки */
  priceFrom: number
  /** Индивидуальные витрины; пусто — в карточке МП не показываем или только общие из конфига */
  marketplaceLinks: Partial<Record<MarketplaceId, string>>
  updatedAt: string
  /** Показывать в блоке на главной (поле в админке) */
  showOnHome: boolean
  /** Тизеры: рекомендуем / хит / новинка */
  teasers: ProductTeaser[]
  /** Безопасный HTML с бэкенда; если есть — показываем вместо plain description */
  descriptionHtml?: string
  variants?: ProductVariantRow[]
  specifications?: ProductSpecificationRow[]
  defaultVariantId?: string | null
  seo?: ProductSeo
}

/** Подписи для демо-моков и блока «Виды тентов» (картинки по слагу) */
export const CATEGORY_LABELS: Record<string, string> = {
  truck: 'Для транспорта',
  warehouse: 'Ангары и склады',
  cafe: 'Кафе и террасы',
  events: 'Мероприятия',
}

/** Мок-данные до API Django */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    slug: 'tent-polupricep-20t',
    title: 'Тент на полуприцеп 20 т',
    excerpt: 'ПВХ 900 г/м², люверсы, усиленные швы. Под типовые рамы.',
    description:
      'Изделие для стандартных полуприцепов с кривой крыши. Материал ПВХ 900 г/м², устойчив к морозу и УФ. По периметру люверсы шагом 30 см, усиление в зонах натяжения. Возможны люверсы под вашу схему крепления. Монтаж на объекте или самовывоз с производства.',
    category: 'truck',
    images: [
      'https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=1200&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',
    ],
    priceFrom: 42000,
    marketplaceLinks: {
      wb: 'https://www.wildberries.ru/catalog/0/search.aspx?search=тент%20полуприцеп',
      ozon: 'https://www.ozon.ru/search/?text=тент%20фура',
    },
    updatedAt: '2026-03-15',
    showOnHome: true,
    teasers: ['bestseller', 'recommended'],
  },
  {
    id: 'p2',
    slug: 'tent-fura-tentovannyj',
    title: 'Тент тентованный на фуру',
    excerpt: 'Сдвижной тент, ремонт и замена полотна.',
    description:
      'Ремонт и изготовление сдвижных тентов для тентованных фур. Подбор цвета и плотности ПВХ, замена направляющих по согласованию. Срок изготовления от 5 рабочих дней.',
    category: 'truck',
    images: [
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80',
      'https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=1200&q=80',
    ],
    priceFrom: 38000,
    marketplaceLinks: { ym: 'https://market.yandex.ru/search?text=тент%20фура' },
    updatedAt: '2026-02-20',
    showOnHome: false,
    teasers: ['new'],
  },
  {
    id: 'p3',
    slug: 'naves-sklad-400',
    title: 'Навес складской каркасный',
    excerpt: 'До 400 м², модульная сборка, ПВХ или ткань.',
    description:
      'Каркас из оцинкованного профиля, натяжное полотно. Проект и монтаж под ключ. Подходит для логистических площадок и временных складов.',
    category: 'warehouse',
    images: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
    ],
    priceFrom: 890000,
    marketplaceLinks: {
      avito: 'https://www.avito.ru/moskva?q=навес%20склад',
    },
    updatedAt: '2026-03-28',
    showOnHome: false,
    teasers: ['recommended'],
  },
  {
    id: 'p4',
    slug: 'angar-bystrovozvodimyj',
    title: 'Быстровозводимый ангар',
    excerpt: 'Тентовый ангар под технику и хранение.',
    description:
      'Быстрый монтаж без капитального фундамента (при необходимости — якорение). Высота и пролёт по заданию. Консультация инженера на объекте.',
    category: 'warehouse',
    images: [
      'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&q=80',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80',
    ],
    priceFrom: 1200000,
    marketplaceLinks: {},
    updatedAt: '2026-01-10',
    showOnHome: false,
    teasers: [],
  },
  {
    id: 'p5',
    slug: 'terassa-kafe-razdvizhnaya',
    title: 'Терраса для кафе, раздвижная',
    excerpt: 'Акрил или ПВХ, каркас алюминий, дренаж.',
    description:
      'Коммерческие террасы с раздвижными секциями. Материалы с сертификатами пожарной безопасности для общепита. Дизайн под фирменный стиль.',
    category: 'cafe',
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    ],
    priceFrom: 185000,
    marketplaceLinks: {
      wb: 'https://www.wildberries.ru/',
      ozon: 'https://www.ozon.ru/',
      ym: 'https://market.yandex.ru/',
    },
    updatedAt: '2026-03-22',
    showOnHome: true,
    teasers: ['recommended'],
  },
  {
    id: 'p6',
    slug: 'naves-letnij-veranda',
    title: 'Летняя веранда с навесом',
    excerpt: 'Стационарный или сборный вариант.',
    description:
      'Навес над зоной посадки гостей, защита от дождя и солнца. Интеграция с освещением и обогревателями по проекту.',
    category: 'cafe',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    ],
    priceFrom: 95000,
    marketplaceLinks: { avito: 'https://www.avito.ru/' },
    updatedAt: '2026-02-01',
    showOnHome: false,
    teasers: ['bestseller'],
  },
  {
    id: 'p7',
    slug: 'shater-meropriyatie-10x15',
    title: 'Шатёр 10×15 м',
    excerpt: 'Выставки, свадьбы, корпоративы.',
    description:
      'Сборно-разборный шатёр с боковыми стенами из прозрачного ПВХ или ткани. Монтаж бригадой, сдача под ключ.',
    category: 'events',
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
      'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=1200&q=80',
    ],
    priceFrom: 220000,
    marketplaceLinks: {
      ozon: 'https://www.ozon.ru/',
    },
    updatedAt: '2026-03-05',
    showOnHome: true,
    teasers: ['new', 'recommended'],
  },
  {
    id: 'p8',
    slug: 'szena-naves-scenicheskij',
    title: 'Сценический навес',
    excerpt: 'Под сцену и зону зрителей.',
    description:
      'Усиленный каркас, расчёт ветровых нагрузок. Обшивка по согласованию. Подходит для городских и частных площадок.',
    category: 'events',
    images: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    ],
    priceFrom: 450000,
    marketplaceLinks: {},
    updatedAt: '2025-12-18',
    showOnHome: false,
    teasers: [],
  },
  {
    id: 'p9',
    slug: 'tent-pickup',
    title: 'Тент на пикап / раму',
    excerpt: 'По размерам кузова, выездной замер или по чертежу.',
    description:
      'Индивидуальный раскрой под вашу модель. Крепления под тентовые дуги или люверсы. Цвет на выбор из палитры ПВХ.',
    category: 'truck',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80',
    ],
    priceFrom: 28000,
    marketplaceLinks: {
      wb: 'https://www.wildberries.ru/',
    },
    updatedAt: '2026-03-30',
    showOnHome: true,
    teasers: ['new'],
  },
  {
    id: 'p10',
    slug: 'ukrytie-strojploshadka',
    title: 'Укрытие строительной площадки',
    excerpt: 'Временный тент от осадков.',
    description:
      'Быстрое развёртывание, якорение к балласту. Срок службы полотна до 7 лет при правильной эксплуатации.',
    category: 'warehouse',
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
      'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&q=80',
    ],
    priceFrom: 156000,
    marketplaceLinks: { avito: 'https://www.avito.ru/moskva?q=тент%20стройка' },
    updatedAt: '2026-02-14',
    showOnHome: false,
    teasers: [],
  },
  {
    id: 'p11',
    slug: 'markiza-vitrina',
    title: 'Маркиза для витрины',
    excerpt: 'Компактный выдвижной навес.',
    description:
      'Защита витрины и посетителей от прямого солнца. Электропривод опционально. Цвет корпуса RAL по каталогу.',
    category: 'cafe',
    images: [
      'https://images.unsplash.com/photo-1559327164-6d3a35fdbc8c?w=1200&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    ],
    priceFrom: 62000,
    marketplaceLinks: {
      ym: 'https://market.yandex.ru/',
      ozon: 'https://www.ozon.ru/',
    },
    updatedAt: '2026-03-12',
    showOnHome: false,
    teasers: ['recommended', 'new'],
  },
  {
    id: 'p12',
    slug: 'palatka-promo',
    title: 'Промо-палатка 3×3',
    excerpt: 'Брендирование, быстрая установка.',
    description:
      'Каркас алюминий, ткань с печатью логотипа. Комплект с сумкой для транспортировки.',
    category: 'events',
    images: [
      'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1200&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
    ],
    priceFrom: 18500,
    marketplaceLinks: {
      wb: 'https://www.wildberries.ru/',
      ozon: 'https://www.ozon.ru/',
      ym: 'https://market.yandex.ru/',
      avito: 'https://www.avito.ru/',
    },
    updatedAt: '2026-03-25',
    showOnHome: true,
    teasers: ['bestseller'],
  },
]

/** Товары с флагом «на главной» (аналог фильтра в админке) */
export function getHomeFeaturedProducts(): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.showOnHome)
}

export function getProductBySlug(slug: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.slug === slug)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(
    0,
    limit,
  )
}
