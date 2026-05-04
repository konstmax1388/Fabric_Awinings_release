import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { alpha, Box, Typography } from '@mui/material'
import { useResourceContext } from 'react-admin'

import { BRAND } from '../lib/branding'
import { STAFF_RESOURCE_INTROS } from '../lib/staffResourceIntros'

type StaffResourceIntroProps = {
  /** Если список на другом URL, но тот же resource (например очередь модерации). */
  introKey?: string
}

export function StaffResourceIntro({ introKey }: StaffResourceIntroProps) {
  const resource = useResourceContext()
  const key = introKey ?? resource
  if (!key) return null
  const meta = STAFF_RESOURCE_INTROS[key as keyof typeof STAFF_RESOURCE_INTROS]
  if (!meta) return null

  return (
    <Box
      sx={{
        mb: 2.5,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(BRAND.accent, 0.22)}`,
        background: `linear-gradient(135deg, ${alpha(BRAND.accent, 0.06)} 0%, ${alpha(BRAND.green, 0.04)} 100%)`,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
        <InfoOutlinedIcon sx={{ fontSize: 22, color: 'primary.main', mt: 0.15, flexShrink: 0 }} aria-hidden />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.65, fontWeight: 500 }}>
            {meta.lead}
          </Typography>
          {meta.tips && meta.tips.length > 0 ? (
            <Box
              component="ul"
              sx={{
                m: 0,
                mt: 1.25,
                pl: 2,
                color: 'text.secondary',
                fontSize: '0.8125rem',
                lineHeight: 1.55,
              }}
            >
              {meta.tips.map((t: string) => (
                <li key={t}>{t}</li>
              ))}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}
