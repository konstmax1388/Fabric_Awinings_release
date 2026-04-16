import type { LayoutProps } from 'react-admin'
import { Layout } from 'react-admin'

import { AdminMenu } from './AdminMenu'
import { PremiumAppBar } from './PremiumAppBar'
import { PremiumSidebar } from './PremiumSidebar'

export function AdminLayout(props: LayoutProps) {
  return (
    <Layout {...props} menu={AdminMenu} appBar={PremiumAppBar} sidebar={PremiumSidebar} />
  )
}
