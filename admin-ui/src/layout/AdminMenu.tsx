import HomeWorkIcon from '@mui/icons-material/HomeWork'
import PlaylistAddCheckCircleIcon from '@mui/icons-material/PlaylistAddCheckCircle'
import { Box, ListSubheader, Typography } from '@mui/material'
import { Menu, useSidebarState } from 'react-admin'

import { BrandLogo } from '../components/BrandLogo'

const subSx = {
  bgcolor: 'transparent',
  fontWeight: 700,
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  color: 'text.secondary',
  lineHeight: 2.5,
  mt: 1.5,
  mb: 0.25,
}

/**
 * Панель для менеджеров и руководителей: заказы, витрина, контент, лиды.
 * Технические настройки (сайт, интеграции, учётные записи, шаблоны писем) — в Django Admin.
 */
export function AdminMenu() {
  const [open] = useSidebarState()

  return (
    <Menu>
      {open ? (
        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
          <BrandLogo height={40} sx={{ maxWidth: '100%' }} />
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1.25,
              lineHeight: 1.45,
              color: 'text.secondary',
              fontSize: '0.72rem',
            }}
          >
            Каталог, заказы и материалы для сайта. Системные настройки и интеграции — только в Django Admin (для
            технического специалиста).
          </Typography>
        </Box>
      ) : null}
      <Menu.DashboardItem />
      <ListSubheader disableSticky sx={subSx}>
        Сайт
      </ListSubheader>
      <Menu.Item to="/home-content" primaryText="Главная страница" leftIcon={<HomeWorkIcon />} />
      <ListSubheader disableSticky sx={subSx}>
        Каталог
      </ListSubheader>
      <Menu.ResourceItem name="product-categories" />
      <Menu.ResourceItem name="products" />
      <ListSubheader disableSticky sx={subSx}>
        Заказы и лиды
      </ListSubheader>
      <Menu.ResourceItem name="orders" />
      <Menu.ResourceItem name="callback-leads" />
      <Menu.ResourceItem name="calculator-leads" />
      <ListSubheader disableSticky sx={subSx}>
        Контент
      </ListSubheader>
      <Menu.ResourceItem name="portfolio-projects" />
      <Menu.Item
        to="/reviews/moderation"
        primaryText="Очередь модерации отзывов"
        leftIcon={<PlaylistAddCheckCircleIcon />}
      />
      <Menu.ResourceItem name="reviews" />
      <Menu.ResourceItem name="blog-posts" />
      <ListSubheader disableSticky sx={subSx}>
        Покупатели
      </ListSubheader>
      <Menu.ResourceItem name="customer-profiles" />
      <Menu.ResourceItem name="shipping-addresses" />
    </Menu>
  )
}
