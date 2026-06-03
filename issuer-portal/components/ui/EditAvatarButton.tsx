"use client";

import type { SxProps, Theme } from "@mui/material";

import { Avatar, Box, Typography } from "@mui/material";

interface EditAvatarButtonProps {
  avatarUrl?: string | null;
  altText?: string;
  size?: number;
  onEdit?: () => void;
  sx?: SxProps<Theme>;
  // User info for generating initials
  userName?: string;
  userEmail?: string;
  color?: string;
}

const EditAvatarButton: React.FC<EditAvatarButtonProps> = ({
  avatarUrl,
  altText = "User Avatar",
  size = 100,
  onEdit,
  sx,
  userName,
  userEmail,
  color,
}) => {
  // Generate initials from user name or email
  const getInitials = () => {
    if (userName) {
      return userName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (userEmail) {
      return userEmail.substring(0, 2).toUpperCase();
    }
  };
  return (
    <Box
      position="relative"
      display="inline-block"
      aria-label="Edit your profile photo"
      onClick={onEdit}
      sx={{
        ...sx,
        overflow: "hidden",
        cursor: "pointer",
        borderRadius: "50%",
        "&:hover .MuiTypography-root": {
          opacity: 1,
          visibility: "visible",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
      }}
    >
      <Avatar
        src={avatarUrl ?? undefined}
        alt={altText}
        sx={{
          width: size,
          height: size,
          ontSize: size / 3,
          backgroundColor: color ?? "var(--mui-palette-primary-main)",
        }}
      >
        {!avatarUrl && getInitials()}
      </Avatar>
      <Typography
        variant="body3"
        component="span"
        align="center"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          visibility: "hidden",
          transition: (theme) =>
            theme.transitions.create(["transform", "opacity"], {
              duration: theme.transitions.duration.short,
            }),
          height: "100%",
          opacity: 0,
          color: "#fff",
          backgroundColor: `rgba(0,0,0,0.6)`,
        }}
      >
        Edit
      </Typography>
    </Box>
  );
};

export default EditAvatarButton;
