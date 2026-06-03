import { expect, test } from "@playwright/test";

import { getAllClientLogos, getClientLogo, hasClientLogo } from "../clientUtils";

test.describe("clientUtils", () => {
  test.describe("getClientLogo", () => {
    test("should return correct logo for exact client name match", () => {
      expect(getClientLogo("The Wendy's Company")).toBe("/logos/wendys_logo.svg.svg");
      expect(getClientLogo("Paycom Software, Inc.")).toBe("/logos/paycom_logo.svg.svg");
      expect(getClientLogo("Woodward, Inc.")).toBe("/logos/woodward_logo.svg.svg");
      expect(getClientLogo("Enliven Therapeutics, Inc.")).toBe("/logos/enliven-logo.svg");
    });

    test("should return correct logo for ticker match", () => {
      expect(getClientLogo(undefined, "WEN")).toBe("/logos/wendys_logo.svg.svg");
      expect(getClientLogo(undefined, "PAYC")).toBe("/logos/paycom_logo.svg.svg");
      expect(getClientLogo(undefined, "WWD")).toBe("/logos/woodward_logo.svg.svg");
      expect(getClientLogo(undefined, "ELVN")).toBe("/logos/enliven-logo.svg");
    });

    test("should return correct logo for account code match", () => {
      expect(getClientLogo(undefined, undefined, "WEN-2024")).toBe("/logos/wendys_logo.svg.svg");
      expect(getClientLogo(undefined, undefined, "PAYC-2024")).toBe("/logos/paycom_logo.svg.svg");
      expect(getClientLogo(undefined, undefined, "WWD-2024")).toBe("/logos/woodward_logo.svg.svg");
      expect(getClientLogo(undefined, undefined, "ELVN-2024")).toBe("/logos/enliven-logo.svg");
    });

    test("should return correct logo for partial name match", () => {
      expect(getClientLogo("Wendy Company")).toBe("/logos/wendys_logo.svg.svg");
      expect(getClientLogo("paycom software")).toBe("/logos/paycom_logo.svg.svg");
      expect(getClientLogo("WOODWARD INC")).toBe("/logos/woodward_logo.svg.svg");
      expect(getClientLogo("enliven therapeutics")).toBe("/logos/enliven-logo.svg");
    });

    test("should return default logo for unknown client", () => {
      expect(getClientLogo("Unknown Company")).toBe("/logos/enliven-logo.svg");
      expect(getClientLogo()).toBe("/logos/enliven-logo.svg");
    });

    test("should prioritize exact name match over ticker", () => {
      expect(getClientLogo("The Wendy's Company", "PAYC")).toBe("/logos/wendys_logo.svg.svg");
    });
  });

  test.describe("hasClientLogo", () => {
    test("should return true for known clients", () => {
      expect(hasClientLogo("The Wendy's Company")).toBe(true);
      expect(hasClientLogo(undefined, "PAYC")).toBe(true);
      expect(hasClientLogo(undefined, undefined, "WWD-2024")).toBe(true);
    });

    test("should return false for unknown clients", () => {
      expect(hasClientLogo("Unknown Company")).toBe(false);
      expect(hasClientLogo()).toBe(false);
    });
  });

  test.describe("getAllClientLogos", () => {
    test("should return all available logo paths", () => {
      const logos = getAllClientLogos();
      expect(logos).toContain("/logos/wendys_logo.svg.svg");
      expect(logos).toContain("/logos/paycom_logo.svg.svg");
      expect(logos).toContain("/logos/woodward_logo.svg.svg");
      expect(logos).toContain("/logos/enliven-logo.svg");
      expect(logos.length).toBeGreaterThan(0);
    });
  });
});
