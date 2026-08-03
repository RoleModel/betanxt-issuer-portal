export const tabulationCardMinHeight = 300;
export const tabulationCardHeaderMinHeight = 10;
export const tabulationChartHeight = 300;
export const tabulationDonutInnerRadius = 80;
export const tabulationDonutOuterRadius = 105;
export const centerLabelOffset = 2;
export const centerLalbeSecondaryOffset = 1.6;

export const tabulationDonutCenterY = 120;
export const tabulationDonutChartMargin = {
  bottom: 40,
  left: 90,
  right: 90,
  top: 30,
} as const;

export const tabulationCardStyles = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  height: "100%",
  minHeight: tabulationCardMinHeight,
  width: "100%",
} as const;

export const tabulationCardHeaderStyles = {
  alignItems: "flex-start",
  minHeight: tabulationCardHeaderMinHeight,
} as const;

export const tabulationCardContentStyles = {
  alignItems: "center",
  display: "flex",
  flex: 1,
  justifyContent: "center",
  pt: 0,
} as const;

export const tabulationCardContentStartStyles = {
  alignItems: "start",
  display: "flex",
  flex: 1,
  justifyContent: "center",
  pt: 0,
} as const;
