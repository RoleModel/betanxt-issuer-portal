"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import {
  Box,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import React from "react";
import { z } from "zod";

/**
 * The legacy Issuer Portal's secure-password rules, checked live as the user
 * types. Mirrors the Operations Manager Edit Profile screen.
 */
interface PasswordRule {
  readonly id: string;
  readonly label: string;
  readonly passes: (password: string) => boolean;
}

/**
 * True when the password contains a run of 4+ sequential alphanumerics
 * ("1234", "abcd"), which the legacy portal rejects.
 */
const hasSequentialRun = (password: string): boolean => {
  const normalized = password.toLowerCase();
  let runLength = 1;

  for (let index = 1; index < normalized.length; index++) {
    const previous = normalized.charCodeAt(index - 1);
    const current = normalized.charCodeAt(index);
    const bothAlphanumeric =
      /[a-z0-9]/u.test(normalized[index - 1] ?? "") &&
      /[a-z0-9]/u.test(normalized[index] ?? "");

    runLength =
      bothAlphanumeric && current === previous + 1 ? runLength + 1 : 1;
    if (runLength >= 4) return true;
  }

  return false;
};

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "upper",
    label: "At least one upper case letter",
    passes: (password) => /[A-Z]/u.test(password),
  },
  {
    id: "lower",
    label: "At least one lower case letter",
    passes: (password) => /[a-z]/u.test(password),
  },
  {
    id: "number",
    label: "At least one number",
    passes: (password) => /\d/u.test(password),
  },
  {
    id: "special",
    label: "At least one special character, like !, @, #, $, %, ^, &, *",
    passes: (password) => /[!@#$%^&*]/u.test(password),
  },
  {
    id: "length",
    label: "Between 8 and 26 characters",
    passes: (password) => password.length >= 8 && password.length <= 26,
  },
  {
    id: "sequence",
    label: "No sequence of 4 or more characters, for example 1234 and abcd",
    passes: (password) => password.length > 0 && !hasSequentialRun(password),
  },
];

/**
 * Zod schema for the legacy secure-password rules. Each failed rule surfaces
 * as its own issue whose message is the rule id, so one parse both gates the
 * form and drives the per-rule checkmarks.
 */
export const securePasswordSchema = z.string().superRefine((value, context) => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.passes(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: rule.id,
      });
    }
  }
});

/** The ids of the rules the password does not yet satisfy. */
export const failedPasswordRuleIds = (
  password: string
): ReadonlySet<string> => {
  const result = securePasswordSchema.safeParse(password);
  return new Set(
    result.success ? [] : result.error.issues.map((issue) => issue.message)
  );
};

export const isSecurePassword = (password: string): boolean =>
  securePasswordSchema.safeParse(password).success;

interface PasswordChangeSectionProps {
  readonly changePassword: boolean;
  readonly onChangePasswordToggle: (change: boolean) => void;
  readonly password: string;
  readonly onPasswordChange: (password: string) => void;
  readonly confirmPassword: string;
  readonly onConfirmPasswordChange: (confirmPassword: string) => void;
}

/**
 * The confirmed-password flow from the legacy Issuer Portal's Edit Profile
 * screen: the password fields stay disabled until the user opts in to a
 * change, the new password must satisfy the legacy secure-password rules —
 * shown as a live checklist — and must be typed twice.
 */
const PasswordChangeSection = ({
  changePassword,
  onChangePasswordToggle,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
}: PasswordChangeSectionProps) => {
  const confirmMismatch =
    changePassword &&
    confirmPassword.length > 0 &&
    confirmPassword !== password;

  // One zod parse drives every checkmark: a rule ticks the moment the
  // password stops failing it.
  const failedRules = failedPasswordRuleIds(password);

  return (
    <Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={changePassword}
            onChange={(event) => {
              onChangePasswordToggle(event.target.checked);
            }}
          />
        }
        label="Change password"
      />
      <Grid container spacing={2}>
        <Grid size={{ sm: 12, md: 6 }}>
          <TextField
            label="New Password"
            value={password}
            onChange={(event) => {
              onPasswordChange(event.target.value);
            }}
            fullWidth
            type="password"
            autoComplete="new-password"
            margin="dense"
            disabled={!changePassword}
          />
        </Grid>
        <Grid size={{ sm: 12, md: 6 }}>
          <TextField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(event) => {
              onConfirmPasswordChange(event.target.value);
            }}
            fullWidth
            type="password"
            autoComplete="new-password"
            margin="dense"
            disabled={!changePassword}
            error={confirmMismatch}
            helperText={confirmMismatch ? "Passwords do not match" : undefined}
          />
        </Grid>
      </Grid>
      {/* The legacy screen keeps the secure-password rules on screen the
          whole time, so the list always shows; the ticks only run while a
          password change is underway. */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          *A secure password contains all of the following:
        </Typography>
        <List dense disablePadding>
          {PASSWORD_RULES.map((rule) => {
            const passes = changePassword && !failedRules.has(rule.id);
            return (
              <ListItem key={rule.id} disableGutters sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {passes ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon
                      color="disabled"
                      fontSize="small"
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={rule.label}
                  slotProps={{
                    primary: {
                      variant: "caption",
                      color: passes ? "text.primary" : "text.secondary",
                    },
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default PasswordChangeSection;
