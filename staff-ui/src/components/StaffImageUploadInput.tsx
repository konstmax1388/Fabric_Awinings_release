import { useState } from 'react'
import { Labeled, useInput } from 'react-admin'

import { staffApiUrl } from '../lib/apiBase'
import { staffFetch } from '../providers/httpStaff'

type Props = {
  source: string
  label?: string
  helperText?: string
}

/** Загрузка в POST /api/staff/v1/uploads/, в форму пишется relativePath. */
export function StaffImageUploadInput({ source, label, helperText }: Props) {
  const { field } = useInput({ source })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await staffFetch(staffApiUrl('/api/staff/v1/uploads/'), {
        method: 'POST',
        body: fd,
      })
      const data = (await res.json()) as { relativePath?: string; file?: string[] }
      if (!res.ok) {
        const msg = Array.isArray(data.file) ? data.file[0] : `HTTP ${res.status}`
        throw new Error(msg)
      }
      if (data.relativePath) field.onChange(data.relativePath)
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Ошибка загрузки')
    } finally {
      setBusy(false)
    }
  }

  const clear = () => {
    field.onChange('')
    setErr(null)
  }

  return (
    <Labeled label={label} fullWidth>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
        <input
          type="text"
          {...field}
          readOnly
          style={{ border: '1px solid #ccc', borderRadius: 4, padding: '6px 8px', fontSize: 14 }}
          placeholder="relativePath после загрузки"
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <input type="file" accept="image/*" disabled={busy} onChange={onFile} />
          <button type="button" style={{ fontSize: 14, textDecoration: 'underline' }} onClick={clear} disabled={busy}>
            Сбросить
          </button>
          {busy ? <span style={{ fontSize: 14, color: '#666' }}>Загрузка…</span> : null}
        </div>
        {helperText ? <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{helperText}</p> : null}
        {err ? <p style={{ fontSize: 14, color: '#b00020', margin: 0 }}>{err}</p> : null}
      </div>
    </Labeled>
  )
}
