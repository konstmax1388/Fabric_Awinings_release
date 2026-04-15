import { Labeled, useInput } from 'react-admin'

import { StaffImageDropZone } from './StaffImageDropZone'

type Props = {
  source: string
  label?: string
  helperText?: string
}

/** Загрузка в POST /api/staff/v1/uploads/, в форму пишется relativePath. Drag-and-drop и выбор файла. */
export function StaffImageUploadInput({ source, label, helperText }: Props) {
  const { field } = useInput({ source })

  return (
    <Labeled label={label} fullWidth>
      <StaffImageDropZone
        label={label ?? 'Изображение'}
        helperText={helperText ?? 'Загрузите файл с компьютера или перетащите в область ниже.'}
        previewAbsoluteUrl={
          field.value && String(field.value).startsWith('http') ? String(field.value) : undefined
        }
        relativePath={
          field.value && !String(field.value).startsWith('http') ? String(field.value) : undefined
        }
        onRelativePath={(path) => field.onChange(path)}
        onClear={() => field.onChange('')}
      />
    </Labeled>
  )
}
