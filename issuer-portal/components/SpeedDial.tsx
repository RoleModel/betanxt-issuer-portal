import * as React from 'react'

import {
  Close as CloseIcon,
  ContactSupportOutlined,
  SmartToyOutlined,
  TopicOutlined,
} from '@mui/icons-material'
import { Typography, styled } from '@mui/material'
import Box from '@mui/material/Box'
import SpeedDial from '@mui/material/SpeedDial'
import type { SpeedDialProps } from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'
import SpeedDialIcon from '@mui/material/SpeedDialIcon'

interface IssuerSpeedDialProps {
  ariaLabel?: string
  icon?: React.ReactElement
  closeIcon?: React.ReactElement
  tooltipTitle?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  onGlossaryClick?: () => void
  onContactsClick?: () => void
  onAssistantClick?: () => void
}

export const StyledSpeedDial = styled(SpeedDial)<SpeedDialProps>(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  right: '24px',
  zIndex: 2500,
  alignItems: 'end',
  '& .MuiSpeedDial-actions': {
    marginLeft: theme.spacing(6.25),
    '& .MuiButtonBase-root': {
      color: theme.vars.palette.primary.contrastText,
      width: 'fit-content',
      alignSelf: 'flex-end',
      padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
      borderRadius: 20,
      marginRight: 0,
      '& .MuiBox-root': {
        alignItems: 'center',
      },
    },
  },
}))

export default function IssuerSpeedDial({
  ariaLabel = 'Issuer Support Tools',
  icon = <ContactSupportOutlined />,
  closeIcon = <CloseIcon />,
  tooltipTitle: _tooltipTitle,
  placement: _placement,
  onClick,
  onGlossaryClick,
  onContactsClick,
  onAssistantClick,
}: IssuerSpeedDialProps) {
  const actions = [
    {
      icon: (
        <Box display="flex" gap={1}>
          <SmartToyOutlined />
          <Typography noWrap variant="button">
            AI Assistant
          </Typography>
        </Box>
      ),
      name: 'AI Assistant',
    },
    {
      icon: (
        <Box display="flex" gap={1}>
          <TopicOutlined />
          <Typography noWrap variant="button">
            Glossary of Terms
          </Typography>
        </Box>
      ),
      name: 'Glossary of Terms',
    },
    {
      icon: (
        <Box display="flex" gap={1}>
          <ContactSupportOutlined />
          <Typography noWrap variant="button">
            Contacts
          </Typography>
        </Box>
      ),
      name: 'Contacts',
    },
  ]

  const handleActionClick = (actionName: string) => {
    switch (actionName) {
      case 'AI Assistant':
        onAssistantClick?.()
        break
      case 'Glossary of Terms':
        onGlossaryClick?.()
        break
      case 'Contacts':
        onContactsClick?.()
        break
      default:
        break
    }
  }

  return (
    <Box
      sx={(theme) => ({
        position: 'fixed',
        bottom: theme.spacing(5.5),
        right: theme.spacing(2),
        zIndex: 500,
        transform: 'translateZ(0px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      })}
    >
      <StyledSpeedDial
        ariaLabel={ariaLabel}
        icon={<SpeedDialIcon icon={icon} openIcon={closeIcon} />}
        onClick={onClick}
        sx={(theme) => ({
          bottom: theme.spacing(3),
          right: 0,
          gap: 1,
          '& .MuiSpeedDial-actions': {
            alignItems: 'flex-end !important',
          },
        })}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            onClick={() => handleActionClick(action.name)}
            slotProps={{
              fab: {
                size: 'medium',
                variant: 'extended',
                color: 'primary',
                'aria-label': action.name,
                sx: {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
                children: <Typography variant="body3">{action.name}</Typography>,
              },
            }}
          />
        ))}
      </StyledSpeedDial>
    </Box>
  )
}
