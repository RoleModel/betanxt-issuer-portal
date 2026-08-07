"use client";

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { BNTypographyPair } from "@rolemodel/betanxt-design-system/components/BNTypographyPair";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import PasswordChangeSection, {
  isSecurePassword,
} from "@/components/Profile/PasswordChangeSection";
import ProfilePhotoModal from "@/components/Profile/ProfilePhotoModal";
import EditAvatarButton from "@/components/ui/EditAvatarButton";

const ProfilePage = () => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [changePassword, setChangePassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: session?.user?.email ?? "",
    password: "",
  });

  // Update form data and avatar when session loads
  useEffect(() => {
    if (session?.user) {
      const nameParts = session.user.name?.split(" ") || [];
      setFormData({
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: session.user.email ?? "",
        password: "",
      });
      // Only update avatar URL from session if we don't have one locally,
      // or if the session image is different from our current avatar URL
      // Don't overwrite a valid avatar URL with null from session
      const sessionImage = session.user.image || null;
      setAvatarUrl((prevAvatarUrl) => {
        // If we have no avatar URL, use whatever the session has
        if (prevAvatarUrl === null) {
          return sessionImage;
        }
        // If session has a valid image URL and it's different, use it
        if (sessionImage && prevAvatarUrl !== sessionImage) {
          return sessionImage;
        }
        // Don't overwrite valid avatar URL with null session image
        return prevAvatarUrl;
      });
    }
  }, [session]);

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  // The legacy portal's confirmed-password gate: while a password change is
  // in progress, Save waits for a rule-satisfying password typed twice.
  const passwordBlocksSave =
    isEditing &&
    changePassword &&
    (!isSecurePassword(formData.password) ||
      confirmPassword !== formData.password);

  const handleChangePasswordToggle = (change: boolean) => {
    setChangePassword(change);
    if (!change) {
      setFormData((prev) => ({ ...prev, password: "" }));
      setConfirmPassword("");
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Save logic would go here - in a real app this would call an API
      // For now, just toggle back to view mode
      setChangePassword(false);
      setConfirmPassword("");
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    // Reset form data to session values
    if (session?.user) {
      const nameParts = session.user.name?.split(" ") || [];
      setFormData({
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: session.user.email ?? "",
        password: "",
      });
    }
    setChangePassword(false);
    setConfirmPassword("");
    setIsEditing(false);
  };

  const handlePhotoEdit = () => {
    setPhotoModalOpen(true);
  };

  const handlePhotoUpdate = (photoUrl: string | null) => {
    // Update local state immediately for instant UI feedback
    setAvatarUrl(photoUrl);
    // The session will be updated by the modal as well
  };
  return (
    <Container
      maxWidth="md"
      className="profile-container"
      sx={{ mt: 4, mb: 4, flexGrow: 1 }}
    >
      <Card>
        <CardHeader
          title={`${formData.firstName} ${formData.lastName}`}
          avatar={
            <EditAvatarButton
              size={60}
              altText="User Avatar"
              avatarUrl={avatarUrl}
              onEdit={handlePhotoEdit}
              userName={session?.user?.name || undefined}
              userEmail={session?.user?.email || undefined}
            />
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ sm: 12, md: 6 }}>
              {!isEditing ? (
                <BNTypographyPair
                  primary={{
                    text: "First Name",
                    variant: "caption",
                    color: "text.secondary",
                  }}
                  secondary={{
                    text: formData.firstName,
                    variant: "body2",
                  }}
                />
              ) : (
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange("firstName")}
                  fullWidth
                  margin="dense"
                />
              )}
            </Grid>
            <Grid size={{ sm: 12, md: 6 }}>
              {!isEditing ? (
                <BNTypographyPair
                  primary={{
                    text: "Last Name",
                    variant: "caption",
                    color: "text.secondary",
                  }}
                  secondary={{
                    text: formData.lastName,
                    variant: "body2",
                  }}
                />
              ) : (
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange("lastName")}
                  fullWidth
                  type="text"
                  margin="dense"
                  disabled={!isEditing}
                />
              )}
            </Grid>
            <Grid size={{ sm: 12, md: 6 }}>
              {!isEditing ? (
                <BNTypographyPair
                  primary={{
                    text: "Email Address",
                    variant: "caption",
                    color: "text.secondary",
                  }}
                  secondary={{
                    text: formData.email,
                    variant: "body2",
                  }}
                />
              ) : (
                <TextField
                  label="Email Address"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  fullWidth
                  autoComplete="email"
                  type="email"
                  margin="dense"
                  disabled={!isEditing}
                />
              )}
            </Grid>
            {!isEditing && (
              <Grid size={{ sm: 12, md: 6 }}>
                <BNTypographyPair
                  primary={{
                    text: "Password",
                    variant: "caption",
                    color: "text.secondary",
                  }}
                  secondary={{
                    text: "***********",
                    variant: "body2",
                  }}
                />
              </Grid>
            )}
            {isEditing && (
              <Grid size={12}>
                <PasswordChangeSection
                  changePassword={changePassword}
                  onChangePasswordToggle={handleChangePasswordToggle}
                  password={formData.password}
                  onPasswordChange={(password) => {
                    setFormData((prev) => ({ ...prev, password }));
                  }}
                  confirmPassword={confirmPassword}
                  onConfirmPasswordChange={setConfirmPassword}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  Profile changes take effect the next time you sign in.
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
        <CardActions sx={{ gap: 1, p: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCancelEdit}
            sx={{ display: isEditing ? "inline-flex" : "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={isEditing ? "success" : "primary"}
            onClick={handleToggleEdit}
            disabled={passwordBlocksSave}
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
        </CardActions>
      </Card>

      {/* Profile Photo Upload Modal */}
      <ProfilePhotoModal
        open={photoModalOpen}
        onClose={() => {
          setPhotoModalOpen(false);
        }}
        currentAvatarUrl={session?.user?.image}
        userName={session?.user?.name || undefined}
        userEmail={session?.user?.email || undefined}
        onPhotoUpdate={handlePhotoUpdate}
      />
    </Container>
  );
};

export default ProfilePage;
