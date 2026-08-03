"use client";

import { TextField } from "@mui/material";

import { useNumberReviewField } from "@/hooks/use-tabulation-review-formatting";

interface NumberReviewFieldProps {
  readonly disabled: boolean;
  readonly label: string;
  readonly onChange: (value: number | null) => void;
  readonly original: number | null;
  readonly value: number | null;
}

/** Editable vote-total field that shows the original value for comparison. */
export const NumberReviewField = ({
  disabled,
  label,
  onChange,
  original,
  value,
}: NumberReviewFieldProps) => {
  const field = useNumberReviewField(value, original);

  return (
    <TextField
      color={field.changed ? "warning" : "primary"}
      disabled={disabled}
      helperText={field.helperText}
      label={label}
      onChange={(event) => {
        onChange(field.parseInput(event.target.value));
      }}
      size="small"
      slotProps={{
        input: {
          inputMode: "numeric",
        },
      }}
      value={field.inputValue}
      sx={{
        minWidth: 150,
        "& .MuiFormHelperText-root": {
          color: field.changed ? "warning.main" : "text.secondary",
          mx: 0,
        },
      }}
    />
  );
};
