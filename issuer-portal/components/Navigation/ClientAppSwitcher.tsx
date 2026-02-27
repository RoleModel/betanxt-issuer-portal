'use client'

import { BNAppSwitcher } from '@rolemodel/betanxt-design-system/components/BNAppSwitcher'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useMemo, useState } from 'react'

import { ArrowDropDownOutlined } from '@mui/icons-material'
import { Box, Button, Menu, MenuItem } from '@mui/material'

import { useClient } from '@/contexts/ClientContext'
import type { Client } from '@/hooks/useClients'
import {
  type EventRow,
  getMeetingUrl,
  parentClientEvents,
  solicitorEvents,
} from '@/utils/eventData'

/** Brand labels for multi-client user types when no event is selected */
const USER_TYPE_BRAND_LABELS: Record<string, string> = {
  PARENT_CLIENT: 'Donnelley Financial Solutions',
  SOLICITOR: 'Morrow Sodali',
}

interface ClientAppSwitcherProps {
  currentAppTitle?: string
}

/**
 * Switch button for PARENT_CLIENT / SOLICITOR users.
 * - On /events: shows the brand name (DFIN / Morrow Sodali) with no dropdown.
 * - On a meeting page with ?issuer= param: shows the issuer name with a dropdown
 *   listing all event companies for that user type.
 */
function EventSwitchButton({ userType }: { userType: string }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const open = Boolean(anchorEl)

  const issuerParam = searchParams.get('issuer')
  const isOnEventsPage = pathname === '/events'

  // Determine display name and whether dropdown is active
  const displayName = useMemo(() => {
    if (issuerParam) return decodeURIComponent(issuerParam)
    return USER_TYPE_BRAND_LABELS[userType] ?? 'Select Client'
  }, [issuerParam, userType])

  const events: EventRow[] = useMemo(() => {
    if (userType === 'PARENT_CLIENT') return parentClientEvents
    if (userType === 'SOLICITOR') return solicitorEvents
    return []
  }, [userType])

  // Dropdown is only active when viewing a specific meeting (issuer param present)
  const hasDropdown = !isOnEventsPage && Boolean(issuerParam)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (hasDropdown) {
      setAnchorEl(event.currentTarget)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleEventSelect = (row: EventRow) => {
    router.push(getMeetingUrl(row))
    handleClose()
  }

  if (!hasDropdown) {
    return <span style={{ padding: '6px 8px' }}>{displayName}</span>
  }

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
        {displayName}
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
              maxHeight: 400,
            },
          },
        }}
      >
        {events.map((row) => (
          <MenuItem
            key={row.id}
            onClick={() => handleEventSelect(row)}
            selected={row.event === displayName}
            sx={{
              '&:hover': {
                backgroundColor: (theme) => theme.vars.palette.appSwitcher?.hover,
              },
              '&.Mui-selected': {
                backgroundColor: (theme) => theme.vars.palette.appSwitcher?.hover,
              },
            }}
          >
            {row.event}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

function SwitchButton() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { availableClients, currentClient, switchClient } = useClient()
  const { data: session } = useSession()
  const open = Boolean(anchorEl)

  // Check if user has permission to switch clients
  const userType = session?.user?.type
  const isAuthBypassed = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  const isEventUser = userType === 'PARENT_CLIENT' || userType === 'SOLICITOR'
  const canSwitchClients =
    isAuthBypassed ||
    userType === 'ADMIN' ||
    userType === 'RELATIONSHIP_MANAGER' ||
    isEventUser ||
    userType === 'CSM'

  // PARENT_CLIENT / SOLICITOR users get a special event-based switcher
  if (isEventUser && userType) {
    return (
      <Suspense
        fallback={
          <span style={{ padding: '6px 8px' }}>
            {USER_TYPE_BRAND_LABELS[userType] ?? 'Loading...'}
          </span>
        }
      >
        <EventSwitchButton userType={userType} />
      </Suspense>
    )
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (canSwitchClients) {
      setAnchorEl(event.currentTarget)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleClientSelect = (client: Client) => {
    switchClient(client)
    handleClose()
  }

  const currentClientName =
    currentClient?.company_name ?? currentClient?.short_name ?? 'Select Client'

  // If user doesn't have permission, just show the client name without dropdown
  if (!canSwitchClients) {
    return <span style={{ padding: '6px 8px' }}>{currentClientName}</span>
  }

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
                backgroundColor: (theme) => theme.vars.palette.appSwitcher?.hover,
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
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: theme.palette.appSwitcher.background,
        color: theme.palette.appSwitcher.contrastText,
      })}
    >
      <SwitchButton />
      <BNAppSwitcher currentAppName={currentAppTitle}>
        <BNAppSwitcher.Item name="Issuer Portal" component="a" href="/" />
      </BNAppSwitcher>
    </Box>
  )
}
