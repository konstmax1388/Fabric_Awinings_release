import type { DataProvider, Identifier, RaRecord } from 'react-admin'

import { staffApiUrl } from '../lib/apiBase'
import { staffFetch, staffFetchJson } from './httpStaff'

/** Имя ресурса RA → path Staff API (kebab-case). */
const RESOURCE_PATH: Record<string, string> = {
  'callback-leads': 'leads/callback',
  'calculator-leads': 'leads/calculator',
  'portfolio-projects': 'portfolio-projects',
  reviews: 'reviews',
  'blog-posts': 'blog-posts',
  orders: 'orders',
  'product-categories': 'product-categories',
  products: 'products',
  'product-variants': 'product-variants',
  'product-images': 'product-images',
  'product-specifications': 'product-specifications',
  'customer-profiles': 'customer-profiles',
  'shipping-addresses': 'shipping-addresses',
}

function pathFor(resource: string): string {
  return RESOURCE_PATH[resource] ?? resource
}

type ListResponse = {
  results?: unknown
  count?: unknown
}

async function staffGetList(
  resource: string,
  params: {
    pagination?: { page?: number; perPage?: number }
    sort?: { field?: string; order?: string }
    filter?: Record<string, unknown>
  },
): Promise<{ data: RaRecord[]; total: number }> {
  const { page = 1, perPage = 25 } = params.pagination ?? {}
  const { field, order } = params.sort ?? {}
  const path = pathFor(resource)
  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(perPage),
    ordering: orderingParam(resource, field, order),
  })
  const search =
    params.filter &&
    typeof (params.filter as { search?: unknown }).search === 'string'
      ? String((params.filter as { search: string }).search).trim()
      : ''
  if (search) qs.set('search', search)

  for (const [k, v] of Object.entries(params.filter ?? {})) {
    if (k === 'search' || v === '' || v === undefined || v === null) continue
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      qs.set(k, String(v))
    }
  }

  const url = `${staffApiUrl(`/api/staff/v1/${path}/`)}?${qs.toString()}`
  const json = (await staffFetchJson(url)) as unknown as ListResponse
  const raw = json.results
  const rows = Array.isArray(raw) ? raw : []
  const data = rows.map((row) => ({ ...(row as object), id: (row as { id: unknown }).id })) as RaRecord[]
  const total = typeof json.count === 'number' ? json.count : data.length
  return { data, total }
}

const DEFAULT_ORDER: Record<string, string> = {
  'portfolio-projects': '-sort_order',
  reviews: '-sort_order',
  'blog-posts': '-published_at',
  'callback-leads': '-created_at',
  orders: '-created_at',
  'calculator-leads': '-created_at',
  products: 'sort_order',
  'product-categories': 'sort_order',
  'customer-profiles': '-updated_at',
  'shipping-addresses': '-created_at',
}

const ORDER_MAP: Record<string, Record<string, string>> = {
  'portfolio-projects': {
    id: 'id',
    title: 'title',
    sortOrder: 'sort_order',
    createdAt: 'created_at',
    category: 'category',
    slug: 'slug',
  },
  reviews: {
    id: 'id',
    name: 'name',
    sortOrder: 'sort_order',
    createdAt: 'created_at',
    rating: 'rating',
  },
  'blog-posts': {
    id: 'id',
    title: 'title',
    publishedAt: 'published_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    slug: 'slug',
  },
  'callback-leads': { id: 'id', createdAt: 'created_at' },
  orders: { id: 'id', orderRef: 'order_ref', createdAt: 'created_at', totalApprox: 'total_approx' },
  'calculator-leads': { id: 'id', createdAt: 'created_at', name: 'name' },
  products: { id: 'id', title: 'title', sortOrder: 'sort_order', slug: 'slug' },
  'product-categories': { id: 'id', title: 'title', sortOrder: 'sort_order', slug: 'slug' },
  'customer-profiles': {
    id: 'id',
    userId: 'user_id',
    phone: 'phone',
    updatedAt: 'updated_at',
    passwordChangeDeadline: 'password_change_deadline',
  },
  'shipping-addresses': {
    id: 'id',
    userId: 'user_id',
    label: 'label',
    city: 'city',
    street: 'street',
    isDefault: 'is_default',
    createdAt: 'created_at',
  },
}

function camelToSnake(field: string): string {
  return field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
}

function orderingParam(
  resource: string,
  field: string | undefined,
  order: string | undefined,
): string {
  if (!field || !order) return DEFAULT_ORDER[resource] ?? '-created_at'
  const snake = ORDER_MAP[resource]?.[field] ?? camelToSnake(field)
  return order === 'ASC' ? snake : `-${snake}`
}

export const dataProvider = {
  getList: (resource: string, params: Parameters<typeof staffGetList>[1]) =>
    staffGetList(resource, params),

  getManyReference: async (
    resource: string,
    params: {
      target: string
      id: Identifier
      pagination: { page: number; perPage: number }
      sort: { field: string; order: 'ASC' | 'DESC' }
      filter?: Record<string, unknown>
    },
  ) => {
    const { target, id, pagination, sort, filter } = params
    if (!target || id === '' || id === undefined) {
      return { data: [] as RaRecord[], total: 0 }
    }
    return staffGetList(resource, {
      pagination,
      sort,
      filter: { ...(filter ?? {}), [target]: id },
    })
  },

  getOne: async (resource: string, params: { id: Identifier }) => {
    const path = pathFor(resource)
    const id = encodeURIComponent(String(params.id))
    const url = staffApiUrl(`/api/staff/v1/${path}/${id}/`)
    const data = (await staffFetchJson(url)) as Record<string, unknown>
    return { data: { ...data, id: data.id } as RaRecord }
  },

  getMany: async (resource: string, params: { ids: Identifier[] }) => {
    const path = pathFor(resource)
    const data: RaRecord[] = []
    for (const id of params.ids) {
      try {
        const enc = encodeURIComponent(String(id))
        const url = staffApiUrl(`/api/staff/v1/${path}/${enc}/`)
        const row = (await staffFetchJson(url)) as Record<string, unknown>
        data.push({ ...row, id: row.id ?? id } as RaRecord)
      } catch {
        /* Один битый id не должен ронять весь список (ReferenceField в таблице). */
        data.push({ id } as RaRecord)
      }
    }
    return { data }
  },

  create: async (resource: string, params: { data: Record<string, unknown> }) => {
    const path = pathFor(resource)
    const url = staffApiUrl(`/api/staff/v1/${path}/`)
    const data = (await staffFetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.data),
    })) as Record<string, unknown>
    return { data: { ...data, id: data.id } as RaRecord }
  },

  update: async (resource: string, params: { id: Identifier; data: Record<string, unknown> }) => {
    const path = pathFor(resource)
    const id = encodeURIComponent(String(params.id))
    const url = staffApiUrl(`/api/staff/v1/${path}/${id}/`)
    const data = (await staffFetchJson(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.data),
    })) as Record<string, unknown>
    return { data: { ...data, id: data.id } as RaRecord }
  },

  updateMany: async () => ({ data: [] as Identifier[] }),

  delete: async (resource: string, params: { id: Identifier }) => {
    const path = pathFor(resource)
    const id = encodeURIComponent(String(params.id))
    const url = staffApiUrl(`/api/staff/v1/${path}/${id}/`)
    const res = await staffFetch(url, { method: 'DELETE' })
    if (!res.ok) {
      const text = await res.text()
      let msg = `HTTP ${res.status}`
      try {
        const j = JSON.parse(text) as { detail?: string }
        if (j.detail) msg = j.detail
      } catch {
        /* ignore */
      }
      throw new Error(msg)
    }
    return { data: { id: params.id } as RaRecord }
  },

  deleteMany: async () => ({ data: [] as Identifier[] }),
} as unknown as DataProvider
