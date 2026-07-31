import {
  Avatar,
  Box,
  Divider,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Popover,
  Typography,
} from "@mui/material";
import React from "react";

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar?: string;
  initials?: string;
}

const supportContacts: Contact[] = [
  {
    id: "1",
    name: "Lisa Woodrow",
    role: "Relationship Manager",
    phone: "978-789-0987",
    email: "lisa.woodrow@betanxt.com",
    avatar: undefined, // Would be replaced with actual image URL
    initials: "LW",
  },
  {
    id: "2",
    name: "Tina Glasgow",
    role: "Meeting Producer",
    phone: "978-908-5680",
    email: "tina.glasgow@betanxt.com",
    avatar: undefined, // Would be replaced with actual image URL
    initials: "TG",
  },
  {
    id: "3",
    name: "Bob Linquist",
    role: "Sales",
    phone: "789-098-0987",
    email: "bob.linquist@betanxt.com",
    avatar: undefined, // Would be replaced with actual image URL
    initials: "BL",
  },
  {
    id: "4",
    name: "Customer Service",
    role: "",
    phone: "789-098-0987",
    email: "customerservice@betanxt.com",
    avatar: undefined,
    initials: "CS",
  },
];

interface SupportContactsPopoverProps {
  readonly open: boolean;
  readonly anchorEl: HTMLElement | null;
  readonly onClose: () => void;
}

const SupportContactsPopover = ({
  open,
  anchorEl,
  onClose,
}: SupportContactsPopoverProps) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          borderRadius: 1,
          bgcolor: "background.paper",
          minWidth: 320,
          maxWidth: 500,
        }}
      >
        <List sx={{ p: 2 }}>
          {supportContacts.map((contact, index) => (
            <React.Fragment key={contact.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                <ListItemAvatar>
                  <Avatar
                    src={contact.avatar}
                    variant="rounded"
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      fontWeight: 400,
                      fontSize: "20px",
                    }}
                  >
                    {contact.initials}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      component="span"
                      variant="body3"
                      fontWeight={500}
                      sx={{ lineHeight: "20px" }}
                    >
                      {contact.name}
                      {contact.role ? ` - ${contact.role}` : null}
                    </Typography>
                  }
                  secondary={
                    <Box
                      component="span"
                      sx={{
                        display: "flex",
                        gap: 1.25,
                        alignItems: "center",
                        mt: 0.25,
                      }}
                    >
                      <Typography
                        component="span"
                        variant="body3"
                        color="text.secondary"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {contact.phone}
                      </Typography>
                      <Link
                        href={`mailto:${contact.email}`}
                        variant="body3"
                        underline="always"
                        sx={{
                          color: "primary.main",
                          textDecorationColor: "primary.main",
                        }}
                      >
                        {contact.email}
                      </Link>
                    </Box>
                  }
                />
              </ListItem>
              {index < supportContacts.length - 1 && <Divider sx={{ my: 0 }} />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Popover>
  );
};

export default SupportContactsPopover;
