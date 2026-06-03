import { Link, Section, Text } from "@react-email/components";
import React from "react";

import { COLORS, FONTS } from "../styles";

interface FooterProps {
  portalBaseUrl: string;
}

export function Footer({ portalBaseUrl }: FooterProps) {
  return (
    <Section
      style={{
        backgroundColor: COLORS.background,
        borderTop: `1px solid ${COLORS.border}`,
        padding: "24px 0",
      }}
    >
      <Text
        style={{
          color: COLORS.muted,
          fontFamily: FONTS.sans,
          fontSize: "12px",
          margin: 0,
          lineHeight: "1.6",
        }}
      >
        BetaNXT <br /> 400 Regency Forest Dr #200 <br /> Cary, NC 27518
        <br />
        <Link href={portalBaseUrl} style={{ color: COLORS.link, textDecoration: "none" }}>
          www.betanxt.com
        </Link>
      </Text>
    </Section>
  );
}
