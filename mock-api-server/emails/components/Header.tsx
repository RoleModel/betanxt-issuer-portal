import { Column, Row, Section, Text } from "@react-email/components";
import React from "react";

import { COLORS, FONTS } from "../styles";
import BNLogo from "./BNLogo";

interface HeaderProps {
  readonly meetingType: string;
  readonly subtitle?: string;
}

export const Header = ({
  meetingType,
  subtitle = "Document Update Notification",
}: HeaderProps) => {
  return (
    <Section
      style={{
        backgroundColor: COLORS.navy,
        padding: "20px 32px",
      }}
    >
      <Row>
        <Column>
          <Text
            style={{
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: "15px",
              fontWeight: "600",
              margin: 0,
              lineHeight: "1.3",
            }}
          >
            {meetingType}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              fontFamily: FONTS.sans,
              fontSize: "12px",
              fontWeight: "400",
              margin: "2px 0 0",
              lineHeight: "1.3",
            }}
          >
            {subtitle}
          </Text>
        </Column>
        <Column align="right">
          <BNLogo />
        </Column>
      </Row>
    </Section>
  );
};
