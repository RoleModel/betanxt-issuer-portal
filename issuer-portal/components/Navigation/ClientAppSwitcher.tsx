'use client'

import {
  type App,
  BNAppSwitcher,
} from '@rolemodel/betanxt-design-system/components/BNAppSwitcher'
import React, { useState } from 'react'

import { ArrowDropDownOutlined } from '@mui/icons-material'
import { Button, Menu, MenuItem } from '@mui/material'

import { useClient } from '@/contexts/ClientContext'
import type { Client } from '@/hooks/useClients'

interface ClientAppSwitcherProps {
  currentAppTitle?: string
}

function SwitchButton() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { availableClients, currentClient, switchClient } = useClient()
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleClientSelect = (client: Client) => {
    switchClient(client)
    handleClose()
  }

  const currentClientName =
    currentClient?.company_name || currentClient?.short_name || 'Select Client'

  return (
    <>
      <Button
        tabIndex={0}
        variant="text"
        color="inherit"
        endIcon={<ArrowDropDownOutlined />}
        onClick={handleClick}
        sx={{
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {currentClientName}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: (theme) =>
                theme.vars?.palette?.appSwitcher?.background ||
                theme.palette.primary.main,
              color: (theme) => theme.palette.common.white,
              minWidth: 200,
            },
          },
        }}
      >
        {availableClients.map((client) => (
          <MenuItem
            key={client.id}
            onClick={() => handleClientSelect(client)}
            selected={client.id === currentClient?.id}
            sx={{
              '&:hover': {
                backgroundColor: (theme) => theme.vars.palette.appSwitcher?.hover,
              },
              '&.Mui-selected': {
                backgroundColor: (theme) => theme.vars.palette.appSwitcher.hover,
              },
            }}
          >
            {client.company_name || client.short_name}
          </MenuItem>
        ))}
        {availableClients.length === 0 && (
          <MenuItem disabled>No clients available</MenuItem>
        )}
      </Menu>
    </>
  )
}

export function ClientAppSwitcher({
  currentAppTitle = 'Issuer Portal',
}: ClientAppSwitcherProps) {
  // For now, we'll use empty apps array since the BNAppSwitcher is designed for app switching
  // In the future, this could be extended to include other BetaNXT applications
  const apps: App[] = [{ title: 'Issuer Portal', url: '/' }]

  return (
    <BNAppSwitcher
      apps={apps}
      currentAppTitle={currentAppTitle}
      clientName={<SwitchButton />}
    />
  )
}
