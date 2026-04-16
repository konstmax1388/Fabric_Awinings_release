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
import { fetchHomeSection, patchHomeSection } from '../../api/staffApi'
import {
  homeFieldLabelRu,
  STAFF_HOME_IMAGE_URL_LABELS,
  STAFF_HOME_MODEL_IMAGE,
  STAFF_HOME_MODEL_IMAGE_LABELS,
} from '../../lib/staffFieldLabelsRu'
import { HOME_SECTION_LABELS } from './homeLabels'

const PATCH_KEYS = new Set(Object.values(STAFF_HOME_MODEL_IMAGE).map((x) => x.patchKey))
const MODEL_FILE_KEYS = new Set(Object.keys(STAFF_HOME_MODEL_IMAGE))

export default function HomeSectionPage() {
  const { slug = '' } = useParams()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setErr(null)
    try {
      const d = (await fetchHomeSection(slug)) as Record<string, unknown>
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
        if (k === 'slug' || k === 'imageUrls') continue
        body[k] = v
      }
      await patchHomeSection(slug, body)
      setOk('Сохранено')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const title = HOME_SECTION_LABELS[slug] ?? slug

  const imageUrls = useMemo(() => {
    const raw = data?.imageUrls
    if (!raw || typeof raw !== 'object') return null
    return raw as Record<string, string>
  }, [data?.imageUrls])

  const fieldKeys = useMemo(() => {
    if (!data) return []
    return Object.keys(data).filter((k) => {
      if (k === 'slug' || k === 'imageUrls') return false
      if (PATCH_KEYS.has(k)) return false
      if (MODEL_FILE_KEYS.has(k)) return false
      return true
    })
  }, [data])

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

      {imageUrls ? <ImageUrlsPreview imageUrls={imageUrls} /> : null}

      {err ? <Alert severity="error">{err}</Alert> : null}
      {ok ? <Alert severity="success">{ok}</Alert> : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
        {Object.keys(STAFF_HOME_MODEL_IMAGE).map((modelKey) => {
          if (!data || !(modelKey in data)) return null
          const cfg = STAFF_HOME_MODEL_IMAGE[modelKey]
          if (!cfg) return null
          const previewUrl = imageUrls?.[cfg.urlKey] ?? ''
          const rel = typeof data[cfg.patchKey] === 'string' ? (data[cfg.patchKey] as string) : ''
          return (
            <StaffImageDropZone
              key={modelKey}
              label={STAFF_HOME_MODEL_IMAGE_LABELS[modelKey] ?? modelKey}
              helperText="Файл сохранится на сервере после нажатия «Сохранить»."
              previewAbsoluteUrl={previewUrl}
              relativePath={rel || undefined}
              onRelativePath={(path) => setField(cfg.patchKey, path)}
            />
          )
        })}

        {fieldKeys.map((key) => {
          const v = data![key]
          if (key.endsWith('RelativePath')) {
            return (
              <StaffImageDropZone
                key={key}
                label={homeFieldLabelRu(key)}
                helperText="Загрузите файл с компьютера или перетащите в область ниже."
                previewAbsoluteUrl={typeof v === 'string' && v.startsWith('http') ? v : ''}
                relativePath={typeof v === 'string' && v && !v.startsWith('http') ? v : undefined}
                onRelativePath={(path) => setField(key, path)}
              />
            )
          }
          if (typeof v === 'boolean') {
            return (
              <FormControlLabel
                key={key}
                control={
                  <Switch checked={v} onChange={(e) => setField(key, e.target.checked)} color="primary" />
                }
                label={homeFieldLabelRu(key)}
              />
            )
          }
          if (typeof v === 'number') {
            return (
              <TextField
                key={key}
                label={homeFieldLabelRu(key)}
                type="number"
                value={Number.isFinite(v) ? v : 0}
                onChange={(e) => setField(key, e.target.value === '' ? 0 : Number(e.target.value))}
                fullWidth
              />
            )
          }
          const str = v == null ? '' : String(v)
          const multiline = str.length > 80 || str.includes('\n')
          return (
            <TextField
              key={key}
              label={homeFieldLabelRu(key)}
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

function ImageUrlsPreview({ imageUrls }: { imageUrls: Record<string, string> }) {
  const entries = Object.entries(imageUrls).filter(([, url]) => url && String(url).trim())
  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
        Пока нет изображений для этого блока. Загрузите файлы в полях ниже и нажмите «Сохранить» — здесь появится
        превью.
      </Typography>
    )
  }
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Превью на сайте
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.45 }}>
        Так сейчас выглядят картинки после последнего сохранения. Чтобы заменить файл, используйте загрузку в поле
        ниже.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {entries.map(([k, url]) => (
          <Box key={k} sx={{ width: 160 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {STAFF_HOME_IMAGE_URL_LABELS[k] ?? k}
            </Typography>
            <Box
              component="img"
              src={url}
              alt=""
              sx={{
                width: '100%',
                maxHeight: 120,
                objectFit: 'contain',
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: 1,
                borderColor: 'divider',
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
