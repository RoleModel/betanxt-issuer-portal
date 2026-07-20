"use client";

import { Card, CardContent, Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import ChecklistDocumentIconIcon from "@rolemodel/betanxt-design-system/components/icons/brand/ChecklistDocumentIcon";
import FileSearchIcon from "@rolemodel/betanxt-design-system/components/icons/brand/FileSearchIcon";
import GlobeNetworkIcon from "@rolemodel/betanxt-design-system/components/icons/brand/GlobeNetworkIcon";
// Import icons locally within the split chunk
import TrendingUpIcon from "@rolemodel/betanxt-design-system/components/icons/brand/TrendingUpIcon";
import React from "react";

import FeatureTile from "@/components/FeatureTile";
import GlobalStyle from "@/components/mui-styling/GlobalStyles";

export default function ProductsContent() {
  const servicePaperItems = React.useMemo(
    () => [
      {
        title: "End-to-End Proxy Solution",
        description:
          "Issuers require a comprehensive shareholder communications solution to simplify proxy management and BetaNXT Engage shareholders. BetaNXT streamlines proxy meeting events by centralizing communications and distributing proxy materials.",
        actionText: "Learn More",
        icon: <TrendingUpIcon accentColor="#ebb322" fontSize="3xl" />,
        variant: "base" as const,
        brandFont: true,
        href: "/products/end-to-end-proxy-solutions",
      },
      {
        title: "BetaNXT ENGAGE",
        description:
          "Connect with trusted proxy solicitors to increase shareholder participation and improve vote outcomes. Whether you are managing a routine proposal or navigating a high-stakes campaign, Engage helps you reach the right shareholders, with the right message, at the right time.",
        actionText: "Learn More",
        icon: (
          <ChecklistDocumentIconIcon accentColor="#ebb322" fontSize="3xl" />
        ),
        variant: "primary" as const,
        brandFont: true,
        href: "/products/engage",
      },
      {
        title: "Inspector of Elections",
        description:
          "We serve as the independent authority overseeing vote eligibility, supervising ballot tabulation, and certifying final results. As a core feature of the proxy workflow, this service ensures transparent vote counting and certified inspection tailored to annual and special meetings.",
        actionText: "Learn More",
        icon: <GlobeNetworkIcon accentColor="#ebb322" fontSize="3xl" />,
        variant: "secondary" as const,
        brandFont: true,
        href: "/products/inspector-of-elections",
      },
      {
        title: "Digital Shareholder Meeting",
        description:
          "We support digital and hybrid meetings. Our Digital Shareholder Meeting (DSM) solution enables shareholders to participate in annual meetings remotely with the same level of access as in-person attendees – they can view, vote, and ask questions.",
        actionText: "Learn More",
        icon: <FileSearchIcon accentColor="#ebb322" fontSize="3xl" />,
        variant: "tertiary" as const,
        brandFont: true,
        href: "/products/digital-shareholder-meetings",
      },
    ],
    []
  );

  return (
    <Container component="main" maxWidth="xl" sx={{ p: { xs: 1, md: 3 } }}>
      <GlobalStyle />
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Grid container columns={{ xs: 1, sm: 2, md: 4 }} spacing={2}>
                {servicePaperItems.map((item, index) => (
                  <Grid size={1} key={index}>
                    <FeatureTile {...item} height="100%" />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
