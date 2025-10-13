'use client'

import { components } from '@rolemodel/betanxt-design-system/themes/base/components'
import { layout } from '@rolemodel/betanxt-design-system/themes/base/layout'
import { createBaseDarkOverlays } from '@rolemodel/betanxt-design-system/themes/base/overlays'
import {
  basePaletteDark,
  basePaletteLight,
} from '@rolemodel/betanxt-design-system/themes/base/palette'
import { nxtBlue } from '@rolemodel/betanxt-design-system/themes/base/palette-tokens/brand-tokens'
import { shadows } from '@rolemodel/betanxt-design-system/themes/base/shadows'
import { typography as baseTypography } from '@rolemodel/betanxt-design-system/themes/base/typography'
import type { } from '@rolemodel/betanxt-design-system/themes/mui-type-customizations'

import {
  blue,
  cyan,
  deepPurple,
  green,
  grey,
  lightBlue,
  pink,
  purple,
  teal,
} from '@mui/material/colors'
import type { PaletteColor, PaletteColorOptions, Theme } from '@mui/material/styles'
import { darken, getContrastRatio, lighten } from '@mui/material/styles'
import { deepmerge } from '@mui/utils'
import type { } from '@mui/x-date-pickers/themeAugmentation'

import { clientBranding } from '@/utils/clientBranding'

// Manually reconstruct baseThemeOptions to avoid duplicate CSS variable injection
const baseThemeOptions = {
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: basePaletteLight,
    },
    dark: {
      palette: basePaletteDark,
      overlays: createBaseDarkOverlays(),
    },
  },
  components,
  layout,
  shadows,
  typography: baseTypography,
}

export interface LayoutVars {
  navbarHeight: number
  appSwitcherHeight: number
  footerHeight: number
  drawerWidth: number
  eventTabsHeight: number
}

declare module '@mui/material/styles' {
  interface Palette {
    keydate: Palette['primary']
    tertiary: PaletteColorOptions
    appSwitcher: {
      background: string
      hover: string
      contrastText: string
    }
    phase: [
      PaletteColor,
      PaletteColor,
      PaletteColor,
      PaletteColor,
      PaletteColor,
      PaletteColor,
      PaletteColor,
      PaletteColor,
      PaletteColor,
    ]
    complete: string
    aquaLight: string
  }
  interface PaletteOptions {
    keydate?: PaletteOptions['primary']
    tertiary?: PaletteOptions['primary']
    appSwitcher?: {
      background: string
      hover: string
      contrastText: string
    }
    phase?: [
      PaletteColorOptions,
      PaletteColorOptions,
      PaletteColorOptions,
      PaletteColorOptions,
      PaletteColorOptions,
      PaletteColorOptions,
      PaletteColorOptions,
      PaletteColorOptions,
      PaletteColorOptions,
    ]
    complete?: string
    aquaLight?: string
  }

  interface PaletteColor {
    mainChannel?: string
    lightChannel?: string
    darkChannel?: string
    contrastTextChannel?: string
  }
}

declare module '@mui/material/LinearProgress' {
  interface LinearProgressPropsColorOverrides {
    phase: true
    'chartSeries[0].main': true
    'chartSeries[1].main': true
    'chartSeries[2].main': true
    'chartSeries[3].main': true
    'chartSeries[4].main': true
    'chartSeries[5].main': true
    'chartSeries[6].main': true
    'chartSeries[7].main': true
  }
}

// Type for phase colors that can be used with LinearProgress
export type PhaseColor =
  | 'phase[0].main'
  | 'phase[1].main'
  | 'phase[2].main'
  | 'phase[3].main'
  | 'phase[4].main'
  | 'phase[5].main'
  | 'phase[6].main'
  | 'phase[7].main'
  | 'complete'

// Utility function to get phase color CSS variable (works everywhere)
export const getPhaseColor = (phase: number) => {
  return `var(--mui-palette-phase-${phase - 1}-main)`
}
export const getPhaseContrastText = (phase: number) => {
  return `var(--mui-palette-phase-${phase - 1}-contrastText)`
}

// Utility function to get phase color format for MUI components (e.g., LinearProgress)
export const getPhaseNumber = (phase: number) => {
  return `phase[${phase - 1}].main` as PhaseColor
}

// Status color categories (matching StatusChip logic)
// Only these statuses override the phase color
const STATUS_COLORS: {
  success: string[]
  warning: string[]
  neutral: string[]
} = {
  success: ['COMPLETE', 'AUTHORIZED'],
  warning: ['PENDING_AUTHORIZATION', 'WAITING_FOR_FORM_RETURN'],
  neutral: ['SUBMITTED_AWAITING_RECORD_DATE', 'REQUEST_FORM_TO_FOLLOW'],
}

export const getStatusBorderColor = (
  status: string | null | undefined,
  phaseColor: string,
  theme: Theme
) => {
  if (!status) {
    return phaseColor
  }

  if (STATUS_COLORS.success.includes(status)) {
    return theme.vars.palette.success.main
  }

  if (STATUS_COLORS.warning.includes(status)) {
    return '#EBB322'
  }

  if (STATUS_COLORS.neutral.includes(status)) {
    return theme.vars.palette.grey[400]
  }

  return phaseColor
}

const getClientBranding = (ticker?: string) => {
  if (!ticker) {
    const branding = clientBranding[0]
    return {
      ...branding,
      primaryContrastText:
        getContrastRatio(branding.primaryColor, '#fff') > 4.5 ? '#fff' : '#111',
      secondaryContrastText:
        getContrastRatio(branding.secondaryColor, '#fff') > 4.5 ? '#fff' : '#111',
      tertiaryContrastText:
        getContrastRatio(branding.tertiaryColor, '#fff') > 4.5 ? '#fff' : '#111',
    }
  }

  const branding = clientBranding.find(
    (b: {
      ticker: string
      primaryColor: string
      secondaryColor: string
      tertiaryColor: string
    }) => b.ticker.toLowerCase() === ticker.toLowerCase()
  )

  const selectedBranding = branding ?? clientBranding[0]

  return {
    ...selectedBranding,
    primaryContrastText:
      getContrastRatio(selectedBranding.primaryColor, '#fff') > 4.5 ? '#fff' : '#111',
    secondaryContrastText:
      getContrastRatio(selectedBranding.secondaryColor, '#fff') > 4.5 ? '#fff' : '#111',
    tertiaryContrastText:
      getContrastRatio(selectedBranding.tertiaryColor, '#fff') > 4.5 ? '#fff' : '#111',
  }
}

/**
 * Creates a theme for a specific client based on their ticker
 * @param ticker - The client ticker symbol (e.g., 'WEN', 'PAYC', 'WWD', 'ELVN')
 * @returns MUI Theme configured with client-specific branding colors
 */
export const createClientTheme = (ticker?: string) => {
  const branding = getClientBranding(ticker)

  const clientThemeOptions = deepmerge(baseThemeOptions, {
    colorSchemes: {
      light: {
        palette: {
          primary: {
            main: branding.primaryColor,
            contrastText: branding.primaryContrastText,
          },
          secondary: {
            main: branding.secondaryColor,
            contrastText: branding.secondaryContrastText,
          },
          tertiary: {
            main: branding.tertiaryColor,
            light: lighten(branding.tertiaryColor, 0.2),
            dark: darken(branding.tertiaryColor, 0.2),
            contrastText: branding.tertiaryContrastText,
          },
          appSwitcher: {
            background: '#171717',
            hover: '#363636',
            contrastText: '#ffffff',
          },
          aquaLight: '#CFE2E5',
          keydate: {
            main: '#CCE5FF',
            light: nxtBlue[50],
            dark: nxtBlue[700],
            contrastText: '#004d73',
          },
          phase: [
            {
              main: cyan[800],
              light: cyan[600],
              dark: cyan[900],
              contrastText: '#ffffff',
            },
            {
              main: teal[800],
              light: teal[700],
              dark: teal[900],
              contrastText: teal[50],
            },
            {
              main: purple[700],
              light: purple[500],
              dark: purple[900],
              contrastText: purple[50],
            },
            {
              main: lightBlue[700],
              light: lightBlue[500],
              dark: lightBlue[900],
              contrastText: lightBlue[50],
            },
            {
              main: pink[900],
              light: pink[500],
              dark: pink[900],
              contrastText: pink[50],
            },
            {
              main: blue[800],
              light: blue[400],
              dark: blue[900],
              contrastText: blue[50],
            },
            {
              main: green[800],
              light: green[500],
              dark: green[900],
              contrastText: green[50],
            },
            {
              main: deepPurple[800],
              light: deepPurple[500],
              dark: deepPurple[900],
              contrastText: deepPurple[50],
            },
            {
              main: grey[700],
              light: grey[500],
              dark: grey[900],
              contrastText: grey[50],
            },
          ] as [
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
            ],
          complete: grey[500],
        },
      },
      dark: {
        palette: {
          aquaLight: '#CFE2E5',
          keydate: {
            main: nxtBlue[900],
            light: nxtBlue[700],
            dark: nxtBlue[600],
            contrastText: nxtBlue[100],
          },
          appSwitcher: {
            background: '#080808',
            hover: '#363636',
            contrastText: '#ffffff',
          },
          phase: [
            {
              main: cyan[800],
              light: cyan[300],
              dark: cyan[900],
              contrastText: cyan[50],
            },
            {
              main: teal[600],
              light: teal[400],
              dark: teal[900],
              contrastText: teal[50],
            },
            {
              main: purple[700],
              light: purple[400],
              dark: purple[900],
              contrastText: purple[50],
            },
            {
              main: lightBlue[700],
              light: lightBlue[400],
              dark: lightBlue[900],
              contrastText: lightBlue[50],
            },
            {
              main: pink[700],
              light: pink[400],
              dark: pink[900],
              contrastText: pink[50],
            },
            {
              main: blue[700],
              light: blue[400],
              dark: blue[900],
              contrastText: blue[50],
            },
            {
              main: green[700],
              light: green[500],
              dark: green[900],
              contrastText: green[50],
            },
            {
              main: deepPurple[700],
              light: deepPurple[400],
              dark: deepPurple[900],
              contrastText: deepPurple[50],
            },
            {
              main: grey[600],
              light: grey[400],
              dark: grey[800],
              contrastText: grey[50],
            },
          ] as [
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
              PaletteColor,
            ],
          complete: grey[600],
        },
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1800,
      },
    },
    layout: {
      eventTabsHeight: 158,
      navbarHeight: 66,
      appSwitcherHeight: 38,
      footerHeight: 50,
      drawerWidth: 500,
    },
    components: {
      MuiLink: {
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => ({
            // ...theme.typography.body3,
            color: theme.vars.palette.link,
            fontWeight: 500,
          }),
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => ({
            '&:has(.MuiTable-root)': {
              padding: 0,
            },
            [theme.breakpoints.down('md')]: {
              padding: theme.spacing(1),
            },
            '&:last-child': {
              [theme.breakpoints.down('md')]: {
                padding: theme.spacing(1),
              },
            },
          }),
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 5,
        },
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => ({
            height: 'auto',
            [theme.breakpoints.down('md')]: {
              boxShadow: 'none',
              border: `solid 1px ${theme.vars?.palette.divider}`,
            },
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => ({
            boxShadow: 'none',
            '& .MuiToolbar-root': {
              minHeight: theme.layout?.navbarHeight,
            },
            '& .MuiTabs-root': {
              opacity: 1,
              paddingBottom: 4,
            },
            '& .MuiTabs-flexContainer': {
              height: theme.layout?.navbarHeight,
            },
            '&.MuiAppBar-root.MuiAppBar-colorSecondary': {
              backgroundColor: theme.vars?.palette.appBarSecondary?.defaultFill,
              color: theme.vars?.palette.appBarSecondary?.defaultContrast,
              borderBottom: `1px solid ${theme.vars?.palette.divider}`,
              '& .MuiPaper-root': {
                boxShadow: 'none',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.vars?.palette.primary.main,
                height: 4,
              },
              '& .MuiTab-root ': {
                color: theme.vars?.palette.appBarSecondary?.defaultContrast,
                transition: theme.transitions.create(['color']),
              },
              '& .MuiTab-root:hover ': {
                color: theme.vars?.palette.primary.main,
                boxShadow: `inset 0 -4px 0 0 ${theme.vars?.palette.primary.main}`,
              },
              '& .MuiTabs-root .Mui-selected': {
                color: theme.vars?.palette.primary.main,
              },
            },
          }),
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: ({ ownerState }: { ownerState: { color?: string } }) => {
            const phaseColors = [
              'phase[0].main',
              'phase[1].main',
              'phase[2].main',
              'phase[3].main',
              'phase[4].main',
              'phase[5].main',
              'phase[6].main',
              'phase[7].main',
            ]

            const chartColors = [
              'chartSeries[0].main',
              'chartSeries[1].main',
              'chartSeries[2].main',
              'chartSeries[3].main',
              'chartSeries[4].main',
              'chartSeries[5].main',
              'chartSeries[6].main',
              'chartSeries[7].main',
            ]

            if (ownerState.color && phaseColors.includes(ownerState.color)) {
              const phaseMatch = /phase\[(\d+)\]\.main/.exec(ownerState.color)
              if (phaseMatch) {
                const phaseIndex = phaseMatch[1]
                const phaseColor = `var(--mui-palette-phase-${phaseIndex}-main)`

                return {
                  backgroundColor: `color-mix(in srgb, ${phaseColor} 20%, transparent)`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: phaseColor,
                  },
                }
              }
            }

            if (ownerState.color && chartColors.includes(ownerState.color)) {
              const match = /chartSeries\[(\d+)\]\.main/.exec(ownerState.color)
              if (match) {
                const idx = match[1]
                const chartColor = `var(--mui-palette-chartSeries-${idx}-main)`

                return {
                  backgroundColor: `color-mix(in srgb, ${chartColor} 20%, transparent)`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: chartColor,
                  },
                }
              }
            }

            return {}
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => ({
            borderRadius: 0,
            '& .MuiTypography-root': {
              fontSize: theme.typography.dataCell.fontSize,
            },
            '& .MuiTableContainer-root': {
              borderRadius: 0,
            },
            backgroundColor: theme.vars?.palette.tableCellRow.fill,
            contain: 'paint',
            '& .MuiTableCell-head': {
              borderRadius: 0,
              backgroundColor: theme.vars?.palette.tableHeaderRow.restingFill,
              fontSize: theme.typography.dataHeader.fontSize,
              fontWeight: 600,
              borderBottom: `solid 1px ${theme.vars?.palette.tableHeaderRow.border}`,
            },
            '& .MuiTableHead-root': {
              backgroundColor: theme.vars?.palette.tableHeaderRow.restingFill,
              borderRadius: 0,
            },
            '& .MuiTableCell-root': {
              fontSize: theme.typography.dataCell.fontSize,
              lineHeight: 1.2,
              borderColor: theme.vars?.palette?.dataGridCellRow?.border,
            },
            '& .MuiTableRow-root:last-child': {
              borderBottom: 'none',
              '& .MuiTableCell-root': {
                borderBottom: 'none',
              },
            },
            '& .MuiTypography-caption': {
              lineHeight: theme.typography.caption.lineHeight,
            },
            '& .MuiTableFooter-root': {
              backgroundColor: theme.vars?.palette.dataGridPagination.backgroundFill,
              ...theme.typography.caption,
              '& .MuiTableCell-root': {
                ...theme.typography.caption,
                borderBottom: 'none',
              },
            },
          }),
        },
      },
      MuiPickersLayout: {
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => ({
            backgroundColor: theme.vars.palette.background.paper,
          }),
          contentWrapper: ({ theme }: { theme: Theme }) => ({
            backgroundColor: theme.vars.palette.background.paper,
          }),
        },
      },
      MuiMultiSectionDigitalClock: {
        styleOverrides: {
          root: {
            width: 'auto',
            maxHeight: 'none',
            flexDirection: 'row' as const,
            margin: 0,
          },
        },
      },
      MuiPickersTextField: {
        defaultProps: {
          variant: 'outlined' as const,
        },
        styleOverrides: {
          root: ({ theme }: { theme: Theme }) => ({
            '& .MuiInputLabel-outlined.Mui-focused': {
              color: theme.vars.palette.primary.main,
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.vars.palette.primary.main,
            },
          }),
        },
      },
    },
  })

  return clientThemeOptions
}

// Export theme options instead of created themes to avoid duplicate CSS variable generation
export const wendysThemeOptions = createClientTheme('WEN')
export const paycomThemeOptions = createClientTheme('PAYC')
export const woodwardThemeOptions = createClientTheme('WWD')
export const elevenThemeOptions = createClientTheme('ELVN')
