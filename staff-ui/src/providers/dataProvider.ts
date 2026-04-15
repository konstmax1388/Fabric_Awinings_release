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
  'email-templates': 'email-templates',
  orders: 'orders',
  'product-categories': 'product-categories',
  products: 'products',
  'product-variants': 'product-variants',
  'product-images': 'product-images',
  'product-specifications': 'product-specifications',
  users: 'users',
  groups: 'groups',
}

function pathFor(resource: string): string {
  return RESOURCE_PATH[resource] ?? resource
}

type ListResponse = {
  results: Record<string, unknown>[]
  count: number
}

const DEFAULT_ORDER: Record<string, string> = {
  'portfolio-projects': '-sort_order',
  reviews: '-sort_order',
  'blog-posts': '-published_at',
  'email-templates': 'key',
  'callback-leads': '-created_at',
  orders: '-created_at',
  'calculator-leads': '-created_at',
  products: 'sort_order',
  'product-categories': 'sort_order',
  users: '-date_joined',
  groups: 'name',
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
  'email-templates': { id: 'id', key: 'key' },
  'callback-leads': { id: 'id', createdAt: 'created_at' },
  orders: { id: 'id', orderRef: 'order_ref', createdAt: 'created_at', totalApprox: 'total_approx' },
  'calculator-leads': { id: 'id', createdAt: 'created_at', name: 'name' },
  products: { id: 'id', title: 'title', sortOrder: 'sort_order', slug: 'slug' },
  'product-categories': { id: 'id', title: 'title', sortOrder: 'sort_order', slug: 'slug' },
  users: { id: 'id', username: 'username', dateJoined: 'date_joined' },
  groups: { id: 'id', name: 'name' },
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
  getList: async (
    resource: string,
    params: {
      pagination?: { page?: number; perPage?: number }
      sort?: { field?: string; order?: string }
      filter?: Record<string, unknown>
    },
  ) => {
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

    const url = `${staffApiUrl(`/api/staff/v1/${path}/`)}?${qs.toString()}`
    const json = (await staffFetchJson(url)) as unknown as ListResponse
    const data = json.results.map((row) => ({ ...row, id: row.id })) as RaRecord[]
    return {
      data,
      total: json.count,
    }
  },

  getOne: async (resource: string, params: { id: Identifier }) => {
    if (resource === 'site-settings') {
      const url = staffApiUrl('/api/staff/v1/site-settings/current/')
      const data = (await staffFetchJson(url)) as Record<string, unknown>
      return { data: { ...data, id: 'current' } as RaRecord }
    }
    if (resource === 'home-content') {
      const url = staffApiUrl('/api/staff/v1/home-content/current/')
      const data = (await staffFetchJson(url)) as Record<string, unknown>
      return { data: { ...data, id: 'current' } as RaRecord }
    }
    const path = pathFor(resource)
    const id = encodeURIComponent(String(params.id))
    const url = staffApiUrl(`/api/staff/v1/${path}/${id}/`)
    const data = (await staffFetchJson(url)) as Record<string, unknown>
    return { data: { ...data, id: data.id } as RaRecord }
  },

  getMany: async () => ({ data: [] }),

  getManyReference: async () => ({ data: [], total: 0 }),

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
    if (resource === 'site-settings') {
      const url = staffApiUrl('/api/staff/v1/site-settings/current/')
      const data = (await staffFetchJson(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params.data),
      })) as Record<string, unknown>
      return { data: { ...data, id: 'current' } as RaRecord }
    }
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
