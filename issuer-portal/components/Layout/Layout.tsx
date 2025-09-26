'use client'

import { BNAppFooter } from '@rolemodel/betanxt-design-system/components/BNAppFooter'
import { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import React, { PropsWithChildren, Suspense, useMemo } from 'react'

import { CloseOutlined, SupportAgentOutlined } from '@mui/icons-material'
import { Box } from '@mui/material'
import Fab from '@mui/material/Fab'

import { BNAppBarClient } from '@/components/Navigation/AppBar'
import { ClientAppSwitcher } from '@/components/Navigation/ClientAppSwitcher'
import SupportContactsPopover from '@/components/SupportContactsPopover'

import { useClient } from '@/contexts/ClientContext'

import Loading from '../../app/loading'

type LayoutProps = {
  activeNavLinkTitle?: string
  appSwitcher?: boolean
  navBar?: boolean
  apps?: string
}

const currentApp = 'Issuer Portal'

function Layout({
  children,
  navBar = true,
  appSwitcher = true,
}: PropsWithChildren<LayoutProps>) {
  const [open, setOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    setOpen(!open)
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
    return {
      id,
      name: (effectiveUser as User).name ?? null,
      email: (effectiveUser as User).email ?? null,
      username,
      type,
      accountId,
      roles,
    }
  }, [effectiveUser])

  return (
    <Suspense fallback={<Loading />}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {appSwitcher && (
          <Box aria-label="Client and Application Switcher" role="complementary">
            <ClientAppSwitcher currentAppTitle={currentApp} />
          </Box>
        )}
        {navBar && <BNAppBarClient user={bnUser} />}

        <Box sx={{ flexGrow: 1, flex: 1 }}>{children}</Box>
        <Fab
          color="primary"
          aria-label="Support contacts"
          onClick={handleClick}
          sx={{ position: 'fixed', bottom: 60, right: 20, zIndex: 50 }}
        >
          {open ? <CloseOutlined /> : <SupportAgentOutlined />}
        </Fab>
        <SupportContactsPopover
          open={open}
          anchorEl={anchorEl}
          onClose={() => {
            setOpen(false)
            setAnchorEl(null)
          }}
        />
        <BNAppFooter />
      </Box>
    </Suspense>
  )
}

export default Layout
