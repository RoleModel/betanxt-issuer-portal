"use client";

import { Container } from "@mui/material";
import { usePathname } from "next/navigation";

import SecureFileTransferTable from "@/components/Meeting/SecureFileTransferTable";

const SecureFileTransferPage = () => {
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
};

export default SecureFileTransferPage;
