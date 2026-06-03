import "@rolemodel/betanxt-design-system/components";
// Import betanxt design system type customizations
import "@rolemodel/betanxt-design-system/themes/mui-type-customizations";
import "@mui/material/styles";

declare module "react-pdf" {
  export * from "react-pdf/dist/index.js";
}

declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    appTitle: true;
    body3: true;
    condensed: true;
    dataCell: true;
    dataHeader: true;
    hero: true;
    input: true;
    navTab: true;
    pageTitle: true;
    tableTitle: true;
  }
}
