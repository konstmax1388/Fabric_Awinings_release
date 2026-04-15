import { alpha, createTheme, type Theme } from '@mui/material/styles'
import { deepmerge } from '@mui/utils'
import { defaultLightTheme } from 'react-admin'

import { BRAND } from '../lib/branding'

/**
 * Палитра и типографика как на публичной витрине (docs/design.md, frontend/src/index.css).
 */
const options = deepmerge(defaultLightTheme, {
  palette: {
    primary: {
      main: BRAND.accent,
      light: BRAND.accentLight,
      dark: BRAND.accentDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff',
      contrastText: BRAND.text,
    },
    success: {
      main: BRAND.green,
      dark: BRAND.greenDark,
      contrastText: '#ffffff',
    },
    background: {
      default: BRAND.bgBase,
      paper: BRAND.surface,
    },
    text: {
      primary: BRAND.text,
      secondary: BRAND.textMuted,
      disabled: BRAND.textSubtle,
    },
    divider: BRAND.border,
  },
  shape: {
    borderRadius: 12,
  },
  sidebar: {
    width: 288,
    closedWidth: 58,
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.6 },
    h4: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorSecondary: {
          backgroundColor: `${BRAND.surface}f5`,
          color: BRAND.text,
          borderBottom: `1px solid ${BRAND.borderLight}`,
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 2px rgba(26, 26, 26, 0.04), 0 8px 28px rgba(26, 26, 26, 0.06)',
          border: `1px solid ${alpha(BRAND.text, 0.06)}`,
          backgroundClip: 'padding-box',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          boxShadow: `0 4px 14px ${alpha(BRAND.accent, 0.35)}`,
          '&:hover': {
            boxShadow: `0 6px 18px ${alpha(BRAND.accent, 0.45)}`,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          '&.Mui-focused': { fontWeight: 600 },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(26, 26, 26, 0.18)',
          padding: '12px 18px',
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        enterDelay: 350,
      },
      styleOverrides: {
        tooltip: {
          fontSize: '0.8125rem',
          lineHeight: 1.45,
          borderRadius: 10,
          padding: '8px 12px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
        },
      },
    },
    RaLayout: {
      styleOverrides: {
        root: {
          /* Один фон контента — без второго «полноэкранного» градиента, похожего на дубль layout */
          '& .RaLayout-content': {
            backgroundColor: BRAND.bgBase,
            /* flex-колонка: без minHeight:0 вложенный flex-контент иногда даёт лишнюю прокрутку/«двойной» слой в колонке */
            minHeight: 0,
          },
        },
      },
    },
    RaMenuItemLink: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: 10,
          marginLeft: theme.spacing(1),
          marginRight: theme.spacing(1),
          marginTop: 1,
          marginBottom: 1,
          paddingTop: theme.spacing(1.25),
          paddingBottom: theme.spacing(1.25),
          transition: 'background-color 0.15s ease, color 0.15s ease',
          '&.RaMenuItemLink-active': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.dark,
            fontWeight: 600,
            '& .MuiSvgIcon-root': {
              color: theme.palette.primary.main,
            },
          },
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
          },
        }),
      },
    },
    RaDatagrid: {
      styleOverrides: {
        root: {
          '& .RaDatagrid-headerCell': {
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            color: BRAND.textMuted,
          },
        },
      },
    },
    RaList: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          '& .RaList-main': {
            paddingTop: theme.spacing(0.5),
          },
        }),
      },
    },
    RaEmpty: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          padding: theme.spacing(5, 2),
          [`& .RaEmpty-message`]: {
            color: theme.palette.text.secondary,
            maxWidth: 460,
            margin: '0 auto',
          },
          [`& .RaEmpty-icon`]: {
            width: '4.25rem',
            height: '4.25rem',
            color: alpha(theme.palette.primary.main, 0.42),
          },
          [`& .RaEmpty-toolbar`]: {
            marginTop: theme.spacing(3),
          },
          [`& .RaEmpty-message .MuiTypography-h4`]: {
            fontSize: '1.35rem',
            fontWeight: 600,
            fontFamily: theme.typography.fontFamily,
            letterSpacing: '-0.02em',
            color: theme.palette.text.primary,
            marginBottom: theme.spacing(1),
          },
          [`& .RaEmpty-message .MuiTypography-body1`]: {
            lineHeight: 1.65,
            fontSize: '0.9375rem',
          },
        }),
      },
    },
    RaSimpleForm: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          '& > .MuiStack-root': {
            gap: theme.spacing(2.25),
            width: '100%',
          },
        }),
      },
    },
    RaToolbar: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderTop: `1px solid ${BRAND.borderLight}`,
          background: alpha(BRAND.surface, 0.92),
          backdropFilter: 'blur(8px)',
          paddingTop: theme.spacing(2),
          paddingBottom: theme.spacing(2),
          marginTop: theme.spacing(2),
          gap: theme.spacing(1.5),
        }),
      },
    },
  },
})

export const adminTheme = createTheme(options)
