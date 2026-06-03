import GlobalStyles from "@mui/material/GlobalStyles";

const globalStyles = {
  ":root": {
    "& .MuiPaper-root.MuiDrawer-paperAnchorRight": {
      top: "104px !important",
    },
  },
  "html, body": {
    height: "100%",
  },
  ":root.dark": {
    "& .invert": {
      filter: "invert(1) hue-rotate(176deg) brightness(200%)",
    },
  },
};

const GlobalStyle = () => <GlobalStyles styles={globalStyles} />;

export default GlobalStyle;
