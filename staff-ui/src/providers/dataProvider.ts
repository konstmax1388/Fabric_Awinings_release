import type { DataProvider, Identifier, RaRecord } from 'react-admin'

import { staffApiUrl } from '../lib/apiBase'
import { staffFetchJson } from './httpStaff'

/** Имя ресурса RA → path Staff API (kebab-case). */
const RESOURCE_PATH: Record<string, string> = {
  'callback-leads': 'leads/callback',
}

function pathFor(resource: string): string {
  return RESOURCE_PATH[resource] ?? resource
}

type ListResponse = {
  results: Record<string, unknown>[]
  count: number
}

function orderingFromSort(field: string | undefined, order: string | undefined): string {
  if (field === 'createdAt') {
    return order === 'ASC' ? 'created_at' : '-created_at'
  }
  if (field === 'id') {
    return order === 'ASC' ? 'id' : '-id'
  }
  return '-created_at'
}

export const dataProvider = {
  getList: async (resource: string, params: { pagination?: { page?: number; perPage?: number }; sort?: { field?: string; order?: string } }) => {
    const { page = 1, perPage = 25 } = params.pagination ?? {}
    const { field, order } = params.sort ?? { field: 'createdAt', order: 'DESC' }
    const path = pathFor(resource)
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(perPage),
      ordering: orderingFromSort(field, order),
    })
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

  create: async () => {
    throw new Error('Создание через Staff UI для этого ресурса не настроено.')
  },

  update: async () => {
    throw new Error('Редактирование через Staff UI для этого ресурса не настроено.')
  },

  updateMany: async () => ({ data: [] as Identifier[] }),

  delete: async () => {
    throw new Error('Удаление через Staff UI для этого ресурса не настроено.')
  },

  deleteMany: async () => ({ data: [] as Identifier[] }),
} as unknown as DataProvider
