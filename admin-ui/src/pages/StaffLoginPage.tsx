import { Box, Card, CardContent, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect } from 'react'
import { LoginForm, useCheckAuth, useNavigate } from 'react-admin'

import { BrandLogo } from '../components/BrandLogo'
import { BRAND } from '../lib/branding'

/** Экран входа в цветах витрины: тёплый фон, оранжевый акцент, логотип. */
export default function StaffLoginPage() {
  const checkAuth = useCheckAuth()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth({}, false)
      .then(() => {
        navigate('/')
      })
      .catch(() => {
        /* остаёмся на логине */
      })
  }, [checkAuth, navigate])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: BRAND.bgBase,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 85% 55% at 10% -10%, ${alpha(BRAND.accent, 0.22)}, transparent 55%),
            radial-gradient(ellipse 70% 50% at 100% 100%, ${alpha(BRAND.green, 0.14)}, transparent 50%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Card
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 440,
          width: '100%',
          borderRadius: 3,
          border: `1px solid ${BRAND.borderLight}`,
          background: BRAND.surface,
          boxShadow: `0 24px 64px ${alpha(BRAND.text, 0.08)}, 0 0 0 1px ${alpha(BRAND.accent, 0.06)} inset`,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <BrandLogo height={48} sx={{ maxWidth: 280 }} />
            </Box>
            <Typography
              variant="h5"
              fontWeight={800}
              gutterBottom
              sx={{
                letterSpacing: '-0.02em',
                fontFamily: '"Playfair Display", Georgia, serif',
                color: BRAND.text,
              }}
            >
              Добро пожаловать
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mx: 'auto', lineHeight: 1.6 }}>
              Войдите под своей учётной записью — так же, как в обычный рабочий кабинет. Нужны права staff в
              системе.
            </Typography>
          </Box>
          <Box sx={{ mt: 3 }}>
            <LoginForm />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
