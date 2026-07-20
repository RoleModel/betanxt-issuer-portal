import { Typography } from "@mui/material";

export function ContentTitle({ title }: { title: string }) {
  return (
    <Typography
      variant="h1"
      fontFamily={"var(--font-tungsten)"}
      fontWeight={500}
      fontSize="3rem"
    >
      {title}
    </Typography>
  );
}
