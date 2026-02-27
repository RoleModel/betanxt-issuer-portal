'use client'

import { BNLogo } from '@rolemodel/betanxt-design-system/components/BNLogo'
import { BNAppBar } from '@rolemodel/betanxt-design-system/components/app-bar/BNAppBar'
import type { User } from 'next-auth'
import Image from 'next/image'
import React, { Suspense, useCallback, useMemo, useRef } from 'react'

import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import { Badge, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/material'

import { ClientAppSwitcher } from '@/components/Navigation/ClientAppSwitcher'
import NotificationPopper from '@/components/Notifications/NotificationPopper'

import { useAppBar } from '@/hooks/useAppBar'

// Next.js Image component wrapper for BNAppBar logo
const NextImageComponent = React.memo(
  (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { src, alt, style } = props

    if (!src) {
      return null
    }

    return (
      <Image
        src={src}
        alt={alt ?? 'Logo'}
        width={120}
        height={44}
        style={style}
        loading="eager"
        priority
        blurDataURL={src}
        sizes="(max-width: 600px) 120px, 120px"
      />
    )
  }
)
NextImageComponent.displayName = 'NextImageComponent'

interface BNAppBarWrapperProps {
  title?: string
  logoImg?: React.ReactNode
  logoSrc?: string
  logoImgStyles?: React.CSSProperties
  color?: 'primary' | 'secondary'
  tabPermissions?: Record<string, boolean>
  user?: User
  appSwitcher?: boolean
}

export function BNAppBarClient(props: BNAppBarWrapperProps) {
  return (
    <Suspense fallback={null}>
      <BNAppBarClientMemo {...props} />
    </Suspense>
  )
}

const BNAppBarClientMemo = React.memo(function BNAppBarClientComponent(
  props: BNAppBarWrapperProps
) {
  const notificationButtonRef = useRef<HTMLButtonElement>(null)

  const {
    logoSlotProps,
    isCSM,
    tabs,
    selectedTabValue,
    shouldHideTabs,
    handleTabChange,
    handleWrapperClick,
    currentMeetingId,
    meetingStatus,
    meetingDateLabel,
    avatar,
    menuItems,
    unreadCount,
    notificationsOpen,
    notificationAnchor,
    handleNotificationClick,
    handleNotificationClose,
    isReady,
  } = useAppBar({ logoSrc: props.logoSrc, user: props.user })

  const endSlot = useCallback(
    () => (
      <>
        <IconButton
          ref={notificationButtonRef}
          onClick={handleNotificationClick}
          aria-label="notifications"
          disableRipple={false}
          disableTouchRipple={false}
        >
          <Badge badgeContent={unreadCount} color="primary">
            <NotificationsOutlined />
          </Badge>
        </IconButton>
        <NotificationPopper
          anchorEl={notificationAnchor}
          open={notificationsOpen}
          onClose={handleNotificationClose}
        />
      </>
    ),
    [
      unreadCount,
      notificationsOpen,
      notificationAnchor,
      handleNotificationClick,
      handleNotificationClose,
    ]
  )

  // CSM logo component wrapper that renders BNLogo instead of a client image
  const CSMLogoComponent = useMemo(() => {
    if (!isCSM) return null
    const CSMLogo = () => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: 44 }}>
        <BNLogo height={28} />
      </Box>
    )
    CSMLogo.displayName = 'CSMLogo'
    return CSMLogo
  }, [isCSM])

  const appBarProps = {
    slots: {
      logoImg: isCSM && CSMLogoComponent ? CSMLogoComponent : NextImageComponent,
      end: endSlot,
    },
    slotProps: isCSM ? undefined : logoSlotProps,
    color: 'secondary' as const,
    tabs: shouldHideTabs ? [] : tabs,
    avatar,
    menuItems,
    selectedTabValue,
    meetingStatus,
    onTabChange: handleTabChange,
  }

  if (!isReady) {
    return null
  }

  return (
    <Box onClick={handleWrapperClick}>
      <BNAppBar {...appBarProps}>
        {props.appSwitcher && (
          <Box aria-label="Client and Application Switcher" role="complementary">
            <ClientAppSwitcher currentAppTitle="Issuer Portal" />
          </Box>
        )}
      </BNAppBar>
      {!!currentMeetingId && (
        <Box
          sx={{
            paddingInline: 3,
            paddingBlock: 0.5,
            borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
            backgroundColor: (theme) =>
              !meetingStatus || meetingStatus === 'ACTIVE'
                ? 'transparent'
                : meetingStatus === 'COMPLETE'
                  ? theme.vars.palette.warning.main
                  : theme.vars.palette.warning.main,
            transition: 'background-color 120ms ease',
          }}
        >
          <Typography
            variant="body3"
            fontWeight={500}
            sx={{
              color: (theme) =>
                !meetingStatus || meetingStatus === 'ACTIVE'
                  ? 'text.primary'
                  : meetingStatus === 'COMPLETE'
                    ? theme.vars.palette.warning.contrastText
                    : theme.vars.palette.warning.contrastText,
            }}
          >
            {meetingStatus === 'COMPLETE' && meetingDateLabel
              ? `You are viewing a past meeting from ${meetingDateLabel}.`
              : !meetingStatus || meetingStatus === 'ACTIVE'
                ? 'You are viewing an active meeting.'
                : 'You are viewing a meeting with unknown status.'}
          </Typography>
        </Box>
      )}
    </Box>
  )
})

export { BNAppBar }
