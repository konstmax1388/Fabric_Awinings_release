import { Box, type BoxProps } from '@mui/material'

import { brandLogoUrl } from '../lib/branding'

type BrandLogoProps = Omit<BoxProps, 'children'> & {
  /** Высота логотипа, ширина по пропорциям */
  height?: number
}

/** Логотип как на публичном сайте (`/branding/logo.svg`). */
export function BrandLogo({ height = 36, sx, ...rest }: BrandLogoProps) {
  return (
    <Box
      component="img"
      src={brandLogoUrl()}
      alt="Фабрика тентов"
      height={height}
      sx={{
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        objectPosition: 'left center',
        display: 'block',
        ...sx,
      }}
      {...rest}
    />
  )
}
