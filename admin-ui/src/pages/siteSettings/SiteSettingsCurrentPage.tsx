import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Title } from 'react-admin'

import { fetchSiteSettingsCurrent, patchSiteSettingsCurrent } from '../../api/staffApi'

function isSecretMasked(v: unknown): boolean {
  return v === '***'
}

export default function SiteSettingsCurrentPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState<string | null>(null)

  const load = useCallback(async () => {
    setErr(null)
    try {
      const d = (await fetchSiteSettingsCurrent()) as Record<string, unknown>
      setData(d)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка')
    }
  }, [])

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
        if (k === 'sectionOrder') continue
        if (isSecretMasked(v)) continue
        body[k] = v
      }
      await patchSiteSettingsCurrent(body)
      setOk('Сохранено')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (!data && !err) {
    return (
      <Box sx={{ p: 2 }}>
        <Title title="Настройки: всё" />
        <Typography>Загрузка…</Typography>
      </Box>
    )
  }

  const keys = data ? Object.keys(data).filter((k) => k !== 'sectionOrder') : []

  return (
    <Box sx={{ p: 2, maxWidth: 900 }}>
      <Title title="Настройки: все поля" />
      <Typography variant="h5" gutterBottom>
        Все поля настроек (singleton)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Значения «***» не отправляются обратно (секрет уже задан). Для смены секретов используйте поля `*New` в
        соответствующих секциях или общую форму с ключами из спецификации Staff API.
      </Typography>
      {err ? <Alert severity="error">{err}</Alert> : null}
      {ok ? <Alert severity="success">{ok}</Alert> : null}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {keys.map((key) => {
          const v = data![key]
          if (typeof v === 'boolean') {
            return (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={v}
                  onChange={(e) => setField(key, e.target.checked)}
                />
                <span>{key}</span>
              </label>
            )
          }
          if (typeof v === 'number') {
            return (
              <TextField
                key={key}
                label={key}
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
              label={key}
              value={str}
              onChange={(e) => setField(key, e.target.value)}
              fullWidth
              multiline={multiline}
              minRows={multiline ? 3 : 1}
              disabled={isSecretMasked(v)}
              helperText={isSecretMasked(v) ? 'Секрет задан; меняйте через секцию или поле …New' : undefined}
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
