import type { DataProvider, Identifier, RaRecord } from 'react-admin'

import { staffApiUrl } from '../lib/apiBase'
import { staffFetch, staffFetchJson } from './httpStaff'

/** Имя ресурса RA → path Staff API (kebab-case). */
const RESOURCE_PATH: Record<string, string> = {
  'callback-leads': 'leads/callback',
  'portfolio-projects': 'portfolio-projects',
  reviews: 'reviews',
  'blog-posts': 'blog-posts',
  'email-templates': 'email-templates',
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
