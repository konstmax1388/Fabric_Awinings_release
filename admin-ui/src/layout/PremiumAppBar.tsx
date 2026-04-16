import { Box } from '@mui/material'
import type { AppBarProps } from 'react-admin'
import { AppBar, TitlePortal } from 'react-admin'

import { BrandLogo } from '../components/BrandLogo'

/** Шапка: логотип как на сайте + заголовок страницы. */
export function PremiumAppBar(props: AppBarProps) {
  return (
    <AppBar
      {...props}
      color="secondary"
      elevation={0}
      sx={{
        '&.RaAppBar-appBar': {
          backdropFilter: 'saturate(1.2) blur(8px)',
          backgroundColor: 'rgba(255,255,255,0.94) !important',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
          flex: 1,
          minWidth: 0,
          ml: { xs: 0, sm: 0.5 },
        }}
      >
        <BrandLogo
          height={32}
          sx={{
            height: { xs: 28, sm: 34 },
            maxWidth: { xs: 140, sm: 200, md: 240 },
          }}
        />
        <Box
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: 1,
            height: 24,
            bgcolor: 'divider',
            flexShrink: 0,
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <TitlePortal />
        </Box>
      </Box>
    </AppBar>
  )
}
