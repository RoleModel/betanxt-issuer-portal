'use client'

import { BNAppFooter } from '@rolemodel/betanxt-design-system/components/BNAppFooter'
import type {} from '@rolemodel/betanxt-design-system/themes/mui-type-customizations'
import { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import React, { PropsWithChildren, Suspense, useMemo } from 'react'

import { CloseOutlined, SupportAgentOutlined } from '@mui/icons-material'
import { Box, Stack } from '@mui/material'

import { ResetDemoDataDialog } from '@/components/Dialogs/ResetDemoDataDialog'
import { InfoDialog } from '@/components/InfoDialog'
import { BNAppBarClient } from '@/components/Navigation/AppBar'
import { ClientAppSwitcher } from '@/components/Navigation/ClientAppSwitcher'
import { EventTabs } from '@/components/Navigation/EventTabs'
import IssuerSpeedDial from '@/components/SpeedDial'
import SupportContactsPopover from '@/components/SupportContactsPopover'

import { useClient } from '@/contexts/ClientContext'

import Loading from '../../app/loading'

type LayoutProps = {
  activeNavLinkTitle?: string
  appSwitcher?: boolean
  apps?: string
  navBar?: boolean
  eventTabs?: boolean
}

const currentApp = 'Issuer Portal'

function Layout({
  children,
  appSwitcher = true,
  navBar = true,
  eventTabs = false,
}: PropsWithChildren<LayoutProps>) {
  const [open, setOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const [infoDialogOpen, setInfoDialogOpen] = React.useState(false)
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false)

  const handleGlossaryClick = () => {
    setInfoDialogOpen(true)
  }

  const handleInfoDialogClose = () => {
    setInfoDialogOpen(false)
  }

  const handleContactsClick = () => {
    // Find the SpeedDial element to use as anchor
    const speedDialElement = document.querySelector(
      '[aria-label="Support Contacts"]'
    ) as HTMLElement
    if (speedDialElement) {
      setAnchorEl(speedDialElement)
    }
    setOpen(true)
  }

  const handleResetClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setResetDialogOpen(true)
  }

  const handleResetDialogClose = () => {
    setResetDialogOpen(false)
  }
  const { data: session } = useSession()
  const { currentClient } = useClient()

  // Create effective user object with current client from context
  const effectiveUser = useMemo(() => {
    const user =
      session?.user ||
      (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
        ? ({ name: 'Development', email: 'developer@example.com' } as User)
        : null)
    if (!user) return user
    return {
      ...user,
      client: currentClient,
    }
  }, [session?.user, currentClient])

  // Map NextAuth User to BNAppBarClient's expected user shape
  type BNUser = {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    username?: string
    type?: string
    accountId?: string
    client?: { id: number; name: string }
    roles?: string[]
  }

  const bnUser = useMemo<BNUser | undefined>(() => {
    if (!effectiveUser) return undefined
    const u = effectiveUser as unknown as Record<string, unknown>
    const id = typeof u.id === 'string' ? u.id : 'dev'
    const username = typeof u.username === 'string' ? u.username : undefined
    const type = typeof u.type === 'string' ? u.type : undefined
    const accountId = typeof u.accountId === 'string' ? u.accountId : undefined
    const roles = Array.isArray(u.roles) ? (u.roles as string[]) : undefined
    const userImage = (effectiveUser as User).image ?? null
    return {
      id,
      name: (effectiveUser as User).name ?? null,
      email: (effectiveUser as User).email ?? null,
      image: userImage,
      username,
      type,
      accountId,
      roles,
    }
  }, [effectiveUser])

  return (
    <Suspense fallback={<Loading />}>
      <Stack sx={{ minHeight: '100vh' }}>
        {appSwitcher && (
          <Box
            aria-label="Client and Application Switcher"
            role="complementary"
            sx={{ flexShrink: 0 }}
          >
            <ClientAppSwitcher currentAppTitle={currentApp} />
          </Box>
        )}
        {navBar && (
          <Box sx={{ flexShrink: 0 }}>
            <BNAppBarClient user={bnUser} />
          </Box>
        )}
        {eventTabs && (
          <Box sx={{ flexShrink: 0 }}>
            <EventTabs />
          </Box>
        )}

        <Box component="main" flex="1 0 auto">
          {children}
        </Box>
        {navBar && (
          <IssuerSpeedDial
            ariaLabel="Support Contacts"
            icon={<SupportAgentOutlined />}
            closeIcon={<CloseOutlined />}
            tooltipTitle="Support Contacts"
            placement="top"
            onGlossaryClick={handleGlossaryClick}
            onContactsClick={handleContactsClick}
          />
        )}
        <SupportContactsPopover
          open={open}
          anchorEl={anchorEl}
          onClose={() => {
            setOpen(false)
            setAnchorEl(null)
          }}
        />
        <InfoDialog
          open={infoDialogOpen}
          onClose={handleInfoDialogClose}
          term=""
          definition=""
        />
        <ResetDemoDataDialog open={resetDialogOpen} onClose={handleResetDialogClose} />
        <Box
          sx={{ flexShrink: 0 }}
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.textContent === 'Reset') {
              handleResetClick(e)
            }
          }}
        >
          <BNAppFooter
            links={[
              {
                label: 'Reset',
                href: '#reset-demo',
              },
            ]}
          />
        </Box>
      </Stack>
    </Suspense>
  )
}

export default Layout
