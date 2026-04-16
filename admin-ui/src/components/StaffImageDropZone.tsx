import { alpha } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { useCallback, useRef, useState } from 'react'

import { staffMediaPublicUrl } from '../lib/staffMediaUrl'
import { staffApiUrl } from '../lib/apiBase'
import { staffFetch } from '../providers/httpStaff'
import { BRAND } from '../lib/branding'

type Props = {
  /** Подпись поля */
  label: string
  /** Короткая подсказка под зоной */
  helperText?: string
  /** Абсолютный URL текущего файла (как в GET API) или пусто */
  previewAbsoluteUrl?: string | null
  /** Относительный путь после загрузки — для превью, если нет absolute URL */
  relativePath?: string | null
  onRelativePath: (path: string) => void
  /** Сбросить файл (опционально) */
  onClear?: () => void
  disabled?: boolean
  accept?: string
}

/**
 * Загрузка изображения в Staff API (POST /uploads/), в форму пишется relativePath.
 * Поддержка drag-and-drop и выбора файла с ПК.
 */
export function StaffImageDropZone({
  label,
  helperText,
  previewAbsoluteUrl,
  relativePath,
  onRelativePath,
  onClear,
  disabled,
  accept = 'image/*',
}: Props) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const previewSrc =
    previewAbsoluteUrl?.trim() ||
    (relativePath?.trim() ? staffMediaPublicUrl(relativePath.trim()) : '') ||
    ''

  const uploadFile = async (file: File) => {
    setBusy(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await staffFetch(staffApiUrl('/api/staff/v1/uploads/'), { method: 'POST', body: fd })
      const json = (await res.json()) as { relativePath?: string; file?: string[] }
      if (!res.ok) {
        const msg = Array.isArray(json.file) ? json.file[0] : `HTTP ${res.status}`
        throw new Error(msg)
      }
      if (json.relativePath) onRelativePath(json.relativePath)
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Ошибка загрузки')
    } finally {
      setBusy(false)
    }
  }

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await uploadFile(file)
  }

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      if (disabled || busy) return
      const file = e.dataTransfer.files?.[0]
      if (!file || !file.type.startsWith('image/')) {
        setErr('Перетащите файл изображения')
        return
      }
      await uploadFile(file)
    },
    [busy, disabled],
  )

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {label}
      </Typography>
      {helperText ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25, lineHeight: 1.45 }}>
          {helperText}
        </Typography>
      ) : null}

      <Box
        onDragEnter={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (e.currentTarget === e.target) setDragOver(false)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDrop={onDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : alpha(BRAND.text, 0.2),
          borderRadius: 2,
          bgcolor: dragOver ? alpha(BRAND.accent, 0.06) : alpha(BRAND.surface, 0.5),
          p: 2,
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 120,
              height: 120,
              flexShrink: 0,
              borderRadius: 1.5,
              overflow: 'hidden',
              bgcolor: 'action.hover',
              border: `1px solid ${alpha(BRAND.text, 0.08)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {previewSrc ? (
              <Box
                component="img"
                src={previewSrc}
                alt=""
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <Typography variant="caption" color="text.disabled" sx={{ px: 1, textAlign: 'center' }}>
                Нет файла
              </Typography>
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              disabled={disabled || busy}
              onChange={(e) => void onInputChange(e)}
              style={{ display: 'none' }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                disabled={disabled || busy}
                onClick={() => inputRef.current?.click()}
              >
                {busy ? 'Загрузка…' : 'Выбрать файл'}
              </Button>
              {onClear ? (
                <Button size="small" disabled={disabled || busy} onClick={onClear}>
                  Убрать
                </Button>
              ) : null}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Перетащите изображение сюда или нажмите «Выбрать файл». После сохранения формы файл появится на сайте.
            </Typography>
          </Box>
        </Box>
      </Box>

      {err ? (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {err}
        </Typography>
      ) : null}
    </Box>
  )
}
