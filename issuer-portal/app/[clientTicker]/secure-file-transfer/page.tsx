"use client";

import { Container } from "@mui/material";
import { usePathname } from "next/navigation";
import React from "react";

import SecureFileTransferTable from "@/components/Meeting/SecureFileTransferTable";

export default function SecureFileTransferPage() {
  const pathname = usePathname();
  const clientTicker = pathname.split("/")[1];
  return (
    <Container
      maxWidth="xl"
      sx={{
        p: {
          xs: 1,
          md: 3,
        },
      }}
    >
      <SecureFileTransferTable clientTicker={clientTicker} />
    </Container>
  );
}
