"use client";

import {
  Close as CloseIcon,
  CropFree as CropIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slider,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import React, { useCallback, useRef, useState } from "react";

interface ProfilePhotoModalProps {
  open: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  userName?: string;
  userEmail?: string;
  onPhotoUpdate?: (photoUrl: string | null) => void;
}

const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  open,
  onClose,
  currentAvatarUrl,
  userName,
  userEmail,
  onPhotoUpdate,
}) => {
  const { data: session, update: updateSession } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate initials like in EditAvatarButton
  const getInitials = useCallback(() => {
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
    return "U";
  }, [userName, userEmail]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.onerror = (e) => {
      console.error("FileReader error:", e);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = async () => {
    if (!session?.user?.id) return;

    try {
      setIsUploading(true);
      setError(null);

      // Update user profile via API to remove avatar
      const updateResponse = await fetch(`/api/users/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar_url: null,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update user profile");
      }

      // First update session to ensure all components get the updated data
      if (updateSession) {
        await updateSession({ image: null });
      }

      // Then update the parent component
      onPhotoUpdate?.(null);

      setSelectedFile(null);
      setPreviewUrl(null);
      onClose();
    } catch (_err) {
      setError("Failed to remove photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile || !session?.user?.id) {
      setError("Please select a file and make sure you are logged in.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Create FormData for upload
      const formData = new FormData();
      formData.append("avatar", selectedFile);
      formData.append("scale", cropScale.toString());

      // Upload to Supabase Storage
      const uploadResponse = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        throw new Error(`Failed to upload image: ${uploadResponse.status} - ${errorData}`);
      }

      const uploadData = (await uploadResponse.json()) as { url: string };
      const uploadedUrl = uploadData.url;

      // Update user profile via API
      const updateResponse = await fetch(`/api/users/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar_url: uploadedUrl,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.text();
        throw new Error(`Failed to update user profile: ${updateResponse.status} - ${errorData}`);
      }

      const updatedUserResponse = (await updateResponse.json()) as {
        data: { avatarUrl?: string };
      };
      const updatedUser = updatedUserResponse.data;

      // First update session to ensure all components get the updated data
      if (updateSession) {
        // Force session refresh by calling update with new image data
        await updateSession({ image: updatedUser.avatarUrl ?? null });
      }

      // Then update the parent component immediately for faster UI feedback
      onPhotoUpdate?.(updatedUser.avatarUrl ?? null);

      onClose();
    } catch (_err) {
      setError("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setCropScale(1);
    onClose();
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const hasCurrentPhoto = Boolean(currentAvatarUrl || previewUrl);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        onClick={(e) => {
          // Reset the input value to allow selecting the same file again
          e.currentTarget.value = "";
        }}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h3">Profile Photo</Typography>
            <IconButton size="small" onClick={handleClose} disabled={isUploading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={3} py={2}>
            {/* Avatar Preview */}
            <Box position="relative">
              <Avatar
                src={displayUrl || undefined}
                sx={{
                  width: 150,
                  height: 150,
                  fontSize: 48,
                  transform: previewUrl ? `scale(${cropScale})` : "scale(1)",
                  transition: "transform 0.2s ease-in-out",
                }}
              >
                {!displayUrl && getInitials()}
              </Avatar>

              {previewUrl && (
                <Box
                  position="absolute"
                  top={-10}
                  right={-10}
                  bgcolor="background.paper"
                  borderRadius="50%"
                  boxShadow={2}
                >
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setCropScale(1);
                    }}
                    disabled={isUploading}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Crop Scale Slider (only show when there's a preview) */}
            {previewUrl && (
              <Box width="100%" maxWidth={200}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <CropIcon fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
                  Zoom
                </Typography>
                <Slider
                  value={cropScale}
                  onChange={(_, value) => setCropScale(value)}
                  min={0.5}
                  max={2}
                  step={0.1}
                  disabled={isUploading}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                />
              </Box>
            )}

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ width: "100%" }}>
                {error}
              </Alert>
            )}

            {/* Upload Button */}
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleUploadClick}
              disabled={isUploading}
              size="large"
            >
              {selectedFile ? "Choose Different Photo" : "Upload Photo"}
            </Button>

            {/* Current Photo Info */}
            {!selectedFile && hasCurrentPhoto && (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Current profile photo
              </Typography>
            )}

            {/* File Info */}
            {selectedFile && (
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Box display="flex" width="100%">
            {/* Remove Photo Button */}
            {hasCurrentPhoto && !selectedFile && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRemovePhoto}
                disabled={isUploading}
              >
                {isUploading ? <CircularProgress size={20} /> : "Remove Photo"}
              </Button>
            )}

            <Box ml="auto" display="flex" gap={1}>
              <Button variant="outlined" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>

              {selectedFile && (
                <Button variant="contained" onClick={handleSavePhoto} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Uploading...
                    </>
                  ) : (
                    "Save Photo"
                  )}
                </Button>
              )}
            </Box>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfilePhotoModal;
