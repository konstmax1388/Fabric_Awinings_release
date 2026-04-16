import type { SidebarProps } from 'react-admin'
import { Sidebar } from 'react-admin'

import { BRAND } from '../lib/branding'

/** Боковая панель в тон тёплому фону витрины. */
export function PremiumSidebar(props: SidebarProps) {
  return (
    <Sidebar
      {...props}
      sx={{
        '& .MuiDrawer-paper': {
          background: `linear-gradient(180deg, ${BRAND.surface} 0%, #fdf8f2 45%, #f5f0e8 100%)`,
          borderRight: `1px solid ${BRAND.borderLight}`,
          boxShadow: '4px 0 24px rgba(26, 26, 26, 0.05)',
        },
        ...props.sx,
      }}
    />
  )
}
