/* eslint-disable react/destructuring-assignment */
/* eslint-disable react-doctor/react-compiler-no-manual-memoization */
"use client";

import type { User } from "next-auth";

import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import { Badge, Box, IconButton, Typography } from "@mui/material";
import { BNAppBar } from "@rolemodel/betanxt-design-system/components/app-bar/BNAppBar";
import { BNLogo } from "@rolemodel/betanxt-design-system/components/BNLogo";
import Image from "next/image";
import React, { Suspense, useCallback, useMemo, useRef } from "react";

import { ClientAppSwitcher } from "@/components/Navigation/ClientAppSwitcher";
import NotificationPopper from "@/components/Notifications/NotificationPopper";
import { useAppBar } from "@/hooks/useAppBar";

// Next.js Image component wrapper for BNAppBar logo
const NextImageComponent = React.memo(
  (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { src, alt, style } = props;

    if (!src) {
      return null;
    }

    return (
      <Image
        src={src}
        alt={alt ?? "Logo"}
        width={120}
        height={44}
        style={style}
        loading="eager"
        priority
        blurDataURL={src}
        sizes="(max-width: 600px) 120px, 120px"
      />
    );
  }
);
NextImageComponent.displayName = "NextImageComponent";

interface BNAppBarWrapperProps {
  readonly title?: string;
  readonly logoImg?: React.ReactNode;
  readonly logoSrc?: string;
  readonly logoImgStyles?: React.CSSProperties;
  readonly color?: "primary" | "secondary";
  readonly tabPermissions?: Record<string, boolean>;
  readonly user?: User;
  readonly appSwitcher?: boolean;
}

export const BNAppBarClient = (props: BNAppBarWrapperProps) => {
  return (
    <Suspense fallback={null}>
      <BNAppBarClientMemo {...props} />
    </Suspense>
  );
};

const BNAppBarClientMemo = (props: BNAppBarWrapperProps) => {
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const {
    logoSlotProps,
    isCSM,
    isInClientContext,
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
  } = useAppBar({ logoSrc: props.logoSrc, user: props.user });

  const endSlot = useCallback(
    () => (
      <>
        <IconButton
          color="inherit"
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
  );

  // CSM logo component wrapper that renders BNLogo instead of a client image
  // Only used when CSM is NOT in a client context
  const showCSMBrandLogo = isCSM && !isInClientContext;
  const CSMLogoComponent = useMemo(() => {
    if (!showCSMBrandLogo) return null;
    const CSMLogo = () => (
      <Box sx={{ display: "flex", alignItems: "center", height: 44 }}>
        <BNLogo color="white" height={28} />
      </Box>
    );
    CSMLogo.displayName = "CSMLogo";
    return CSMLogo;
  }, [showCSMBrandLogo]);

  const appBarProps = {
    slots: {
      logoImg:
        showCSMBrandLogo && CSMLogoComponent
          ? CSMLogoComponent
          : NextImageComponent,
      end: endSlot,
    },
    slotProps: showCSMBrandLogo ? undefined : logoSlotProps,
    color: "secondary" as const,
    tabs: shouldHideTabs ? [] : tabs,
    avatar,
    menuItems,
    // Cast: MUI Tabs accepts `false` for "no selection" but BNAppBar types it as `string`.
    // At runtime `false` passes through correctly and suppresses the MUI console warning.
    selectedTabValue: selectedTabValue as string | undefined,
    meetingStatus,
    onTabChange: handleTabChange,
  };

  if (!isReady) {
    return null;
  }

  return (
    <Box onClick={handleWrapperClick}>
      <BNAppBar {...appBarProps}>
        <Box aria-label="Client and Application Switcher">
          <ClientAppSwitcher />
        </Box>
      </BNAppBar>
      {!(currentMeetingId == null) && (
        <Box
          sx={{
            paddingInline: 3,
            paddingBlock: 0.5,
            borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
            backgroundColor: (theme) =>
              !meetingStatus || meetingStatus === "ACTIVE"
                ? "transparent"
                : meetingStatus === "COMPLETE"
                  ? theme.vars.palette.warning.main
                  : theme.vars.palette.warning.main,
            transition: "background-color 120ms ease",
          }}
        >
          <Typography
            variant="body3"
            fontWeight={500}
            sx={{
              color: (theme) =>
                !meetingStatus || meetingStatus === "ACTIVE"
                  ? "text.primary"
                  : meetingStatus === "COMPLETE"
                    ? theme.vars.palette.warning.contrastText
                    : theme.vars.palette.warning.contrastText,
            }}
          >
            {meetingStatus === "COMPLETE" && meetingDateLabel != null
              ? `You are viewing a past meeting from ${meetingDateLabel}.`
              : !meetingStatus || meetingStatus === "ACTIVE"
                ? "You are viewing an active meeting."
                : "You are viewing a meeting with unknown status."}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export { BNAppBar };
