import { Box } from '@mui/material'

type StaffImageThumbProps = {
  src?: string | null
  size?: number
  /** object-fit: cover для сеток, contain для форм загрузки */
  fit?: 'cover' | 'contain'
}

/** Миниатюра для списков и панелей staff: ровный кадр, обрезка по центру. */
export function StaffImageThumb({ src, size = 64, fit = 'cover' }: StaffImageThumbProps) {
  const url = src?.trim()
  if (!url) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: 1,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
    )
  }
  return (
    <Box
      component="img"
      src={url}
      alt=""
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 1,
        objectFit: fit,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        display: 'block',
      }}
    />
  )
}
