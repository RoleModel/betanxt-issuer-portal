import type { Metadata } from "next";
import type { ReactNode } from "react";

import Box from "@mui/material/Box";

export const metadata: Metadata = {
  description:
    "Internal requirements packages for planned Issuer Portal enhancements.",
  title: "Specifications | Issuer Portal",
};

/**
 * Chrome for internal specification routes.
 *
 * @remarks
 * A server component with nothing but metadata and a growth box: the app shell
 * already comes from the root layout, and specs deliberately render inside it
 * so the audience reads them in the same theme as the screens under discussion.
 */
const SpecsLayout = ({ children }: { readonly children: ReactNode }) => (
  <Box flexGrow={1}>{children}</Box>
);

export default SpecsLayout;
