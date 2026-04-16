import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Title } from 'react-admin'
import { useParams } from 'react-router-dom'

import { StaffImageDropZone } from '../../components/StaffImageDropZone'
import { fetchSiteSettingsSection, patchSiteSettingsSection } from '../../api/staffApi'
import { siteSettingsFieldLabelRu } from '../../lib/staffFieldLabelsRu'
import { SITE_SETTINGS_SECTION_LABELS } from './siteLabels'

const IMAGE_PATCH: Record<string, string> = {
  logo: 'logoRelativePath',
  favicon: 'faviconRelativePath',
}

/** Поля со значением «***» → ключ для нового значения (camelCase как в Staff API). */
const SECRET_NEW_FIELDS: Record<string, string> = {
  smtpPassword: 'smtpPasswordNew',
  astrumCrmApiKey: 'astrumCrmApiKeyNew',
  cdekSecurePassword: 'cdekSecurePasswordNew',
  ozonPayClientSecret: 'ozonPayClientSecretNew',
  ozonPayWebhookSecret: 'ozonPayWebhookSecretNew',
  bitrix24WebhookBase: 'bitrix24WebhookBaseNew',
}

const PATCH_RELATIVE_KEYS = new Set(['logoRelativePath', 'faviconRelativePath'])

export default function SiteSettingsSectionPage() {
  const { slug = '' } = useParams()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setErr(null)
    try {
      const d = (await fetchSiteSettingsSection(slug)) as Record<string, unknown>
      setData(d)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка')
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const setField = (key: string, value: unknown) => {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const save = async () => {
    if (!data) return
    setSaving(true)
    setErr(null)
    setOk(null)
    try {
      const body: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(data)) {
        if (k === 'slug') continue
        if (v === '***') continue
        body[k] = v
      }
      await patchSiteSettingsSection(slug, body)
      setOk('Сохранено')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const title = SITE_SETTINGS_SECTION_LABELS[slug] ?? slug

  const fieldKeys = useMemo(() => {
    if (!data) return []
    return Object.keys(data).filter((k) => {
      if (k === 'slug') return false
      if (slug === 'logo' && (k === 'logo' || k === 'favicon')) return false
      if (PATCH_RELATIVE_KEYS.has(k)) return false
      return true
    })
  }, [data, slug])

  if (!slug) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Не указан slug</Typography>
      </Box>
    )
  }

  if (!data && !err) {
    return (
      <Box sx={{ p: 2 }}>
        <Title title={title} />
        <Typography>Загрузка…</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2, maxWidth: 720 }}>
      <Title title={title} />
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      {err ? <Alert severity="error">{err}</Alert> : null}
      {ok ? <Alert severity="success">{ok}</Alert> : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
        {slug === 'logo' && data
          ? (['logo', 'favicon'] as const).map((fk) => {
              if (!(fk in data)) return null
              const patchKey = IMAGE_PATCH[fk]
              const preview = typeof data[fk] === 'string' ? (data[fk] as string) : ''
              const rel = typeof data[patchKey] === 'string' ? (data[patchKey] as string) : ''
              return (
                <StaffImageDropZone
                  key={fk}
                  label={fk === 'logo' ? 'Логотип' : 'Фавикон'}
                  helperText={
                    fk === 'logo'
                      ? 'Рекомендуется SVG, PNG или WebP. Перетащите файл в рамку или нажмите «Выбрать файл».'
                      : 'Иконка во вкладке браузера: .ico или PNG.'
                  }
                  previewAbsoluteUrl={preview}
                  relativePath={rel || undefined}
                  onRelativePath={(path) => setField(patchKey, path)}
                />
              )
            })
          : null}

        {fieldKeys.map((key) => {
          const v = data![key]
          if (typeof v === 'boolean') {
            return (
              <FormControlLabel
                key={key}
                control={
                  <Switch checked={v} onChange={(e) => setField(key, e.target.checked)} color="primary" />
                }
                label={siteSettingsFieldLabelRu(key)}
              />
            )
          }
          if (typeof v === 'number') {
            return (
              <TextField
                key={key}
                label={siteSettingsFieldLabelRu(key)}
                type="number"
                value={Number.isFinite(v) ? v : 0}
                onChange={(e) => setField(key, e.target.value === '' ? 0 : Number(e.target.value))}
                fullWidth
              />
            )
          }
          const str = v == null ? '' : String(v)
          const masked = str === '***'
          const multiline = str.length > 80 || str.includes('\n')
          const newKey = SECRET_NEW_FIELDS[key] ?? `${key}New`

          if (masked) {
            return (
              <TextField
                key={key}
                label={`${siteSettingsFieldLabelRu(key)} — новое значение`}
                type="password"
                onChange={(e) => setField(newKey, e.target.value)}
                fullWidth
                helperText="Оставьте пустым, чтобы не менять сохранённое значение"
              />
            )
          }

          return (
            <TextField
              key={key}
              label={siteSettingsFieldLabelRu(key)}
              value={str}
              onChange={(e) => setField(key, e.target.value)}
              fullWidth
              multiline={multiline}
              minRows={multiline ? 3 : 1}
            />
          )
        })}
      </Box>
      <Button sx={{ mt: 2 }} variant="contained" disabled={saving || !data} onClick={() => void save()}>
        Сохранить
      </Button>
    </Box>
  )
}
