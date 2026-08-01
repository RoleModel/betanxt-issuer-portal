import GlobalStyles from "@mui/material/GlobalStyles";

const globalStyles = {
  ":root": {
    "& .MuiPaper-root.MuiDrawer-paperAnchorRight": {
      top: "104px !important",
    },
  },
  // `root` is the whole-document snapshot. Animating it cross-fades the app
  // bar, event tabs and footer along with the page, so it is pinned to no
  // animation and only the named page subtree below moves. The old/new
  // snapshots are stacked so the chrome does not flash during the swap.
  "::view-transition-old(root), ::view-transition-new(root)": {
    animation: "none",
    mixBlendMode: "normal",
  },
  // `page-content` is the name applied by app/template.tsx — the routed page
  // area beneath the event tabs. Keep the two names in sync.
  "::view-transition-old(page-content)": {
    animation: "300ms cubic-bezier(0.4, 0, 0.2, 1) both fadeOut",
  },
  "::view-transition-new(page-content)": {
    animation: "300ms cubic-bezier(0.4, 0, 0.2, 1) both fadeIn",
  },
  "@keyframes fadeOut": { from: { opacity: 1 }, to: { opacity: 0 } },
  "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
  "@media (prefers-reduced-motion: reduce)": {
    "::view-transition-old(page-content), ::view-transition-new(page-content)":
      {
        animation: "none",
      },
  },
  body: {
    transition: "background-color 0.3s ease",
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
