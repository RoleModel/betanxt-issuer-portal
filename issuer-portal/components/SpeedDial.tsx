import * as React from 'react'

import CloseIcon from '@mui/icons-material/Close'
import ContactSupportOutlinedIcon from '@mui/icons-material/ContactSupportOutlined'
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import { Typography, styled } from '@mui/material'
import Box from '@mui/material/Box'
import SpeedDial from '@mui/material/SpeedDial'
import { SpeedDialProps } from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'
import SpeedDialIcon from '@mui/material/SpeedDialIcon'

import SupportContactsPopover from './SupportContactsPopover'
import IssuerChatbot from './ChatBot/IssuerChatbot'

const actions = [
  {
    icon: (
      <Box display="flex" gap={1}>
        <SmartToyOutlinedIcon />
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
        <ContactsOutlinedIcon />
        <Typography noWrap variant="button">
          Contacts
        </Typography>
      </Box>
    ),
    name: 'Contacts',
  },
]

export const StyledSpeedDial = styled(SpeedDial)<SpeedDialProps>(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  right: theme.spacing(4),
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

export default function IssuerSpeedDial() {
  const [contactsOpen, setContactsOpen] = React.useState(false)
  const [chatbotOpen, setChatbotOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

  const handleActionClick = (actionName: string) => {
    if (actionName === 'Contacts') {
      setContactsOpen(!contactsOpen)
      setChatbotOpen(false) // Close chatbot if open
    } else if (actionName === 'AI Assistant') {
      setChatbotOpen(!chatbotOpen)
      setContactsOpen(false) // Close contacts if open
    }
  }

  const handleContactsClose = () => {
    setContactsOpen(false)
  }

  const handleChatbotClose = () => {
    setChatbotOpen(false)
  }

  return (
    <Box
      sx={(theme) => ({
        position: 'fixed',
        bottom: theme.spacing(7.5),
        right: 0,
        transform: 'translateZ(0px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      })}
    >
      {/* Support Contacts Popover */}
      <SupportContactsPopover
        open={contactsOpen}
        anchorEl={anchorEl}
        onClose={handleContactsClose}
      />

      {/* AI ChatBot */}
      <IssuerChatbot open={chatbotOpen} onClose={handleChatbotClose} />

      <StyledSpeedDial
        ariaLabel="Issuer Support Tools"
        icon={
          <SpeedDialIcon icon={<ContactSupportOutlinedIcon />} openIcon={<CloseIcon />} />
        }
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
                },
                children: <Typography variant="body2">{action.name}</Typography>,
              },
            }}
          />
        ))}
      </StyledSpeedDial>
    </Box>
  )
}
