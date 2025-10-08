'use client'

// Import design system types first
import { nxtBlue } from '@rolemodel/betanxt-design-system/themes/base/palette-tokens/brand-tokens'
import { betanxtThemeOptions } from '@rolemodel/betanxt-design-system/themes/betanxtTheme'
import type {} from '@rolemodel/betanxt-design-system/themes/mui-type-customizations'

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
import type { Theme} from '@mui/material/styles';
import { createTheme } from '@mui/material/styles'
import { deepmerge } from '@mui/utils'
// Import MUI X Date Pickers theme augmentation
import type {} from '@mui/x-date-pickers/themeAugmentation'

import LinkBehavior from '@/components/LinkBehavior'

export interface LayoutVars {
  navbarHeight: number
  appSwitcherHeight: number
  footerHeight: number
  drawerWidth: number
  eventTabsHeight: number
}

declare module '@mui/material/styles' {
  interface Palette {
    // Add custom phase tokens outside of palette
    keydate: Palette['primary']
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
    // Design system palette extensions (should come from design system but adding for now)
  }
  interface PaletteOptions {
    keydate: PaletteOptions['primary']
    phase?: [
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

// Utility function to get task/calendar border color based on status
// Returns phase color for INCOMPLETE and other statuses that don't have special colors
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

  // All other statuses use phase color
  return phaseColor
}

const issuerOverrides = {
  cssVariables: {
    colorScemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        aquaLight: '#CFE2E5',
        keydate: {
          main: '#CCE5FF',
          light: nxtBlue[50],
          dark: nxtBlue[700],
          contrastText: '#004d73', // Darker blue for better contrast (4.5:1 ratio)
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
            light: green[400],
            dark: green[900],
            contrastText: green[50],
          },
          {
            main: deepPurple[600],
            light: deepPurple[400],
            dark: deepPurple[900],
            contrastText: deepPurple[50],
          },
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
    footerHeight: 60,
    drawerWidth: 500,
  },
  components: {
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      },
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          ...theme.typography.body3,
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
              backgroundColor: theme.vars?.palette.appBarSecondary?.tabIndicator,
              height: 4,
            },
            '& .MuiTab-root ': {
              color: theme.vars?.palette.appBarSecondary?.defaultContrast,
              transition: theme.transitions.create(['color']),
            },
            '& .MuiTab-root:hover ': {
              color: theme.vars?.palette.appBarSecondary?.hover,
              boxShadow: `inset 0 -4px 0 0 ${theme.vars?.palette.appBarSecondary?.hover}`,
            },
            '& .MuiTabs-root .Mui-selected': {
              color: theme.vars?.palette.appBarSecondary?.defaultContrast,
            },
          },
          // Add any other custom AppBar styles here
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
            // Extract phase index from 'phase[X].main' format
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
    // MUI X Date Pickers styling
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
          width: 'auto !important',
          maxHeight: 'none !important',
          flexDirection: 'row !important', // Override the column layout
          margin: '0 !important',
        },
      },
    },
    MuiDateTimePicker: {
      defaultProps: {
        // Ensure desktop mode is properly set
        desktopModeMediaQuery: '@media (min-width:900px)',
      },
    },
    MuiDesktopDateTimePicker: {
      defaultProps: {
        // Force proper desktop behavior
        OpenPickerButtonProps: {
          edge: 'end',
        },
      },
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          '& .MuiInputBase-root': {
            backgroundColor: theme.vars.palette.inputOutlinedEnabledFill,
          },
        }),
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
    // You can add more component overrides here as needed
  },
}

const mergedOptions = deepmerge(betanxtThemeOptions, issuerOverrides)
export const theme = createTheme(mergedOptions)
