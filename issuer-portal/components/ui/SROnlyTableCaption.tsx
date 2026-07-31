import React from "react";

const SROnlyTableCaption = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => {
  return (
    <caption
      style={{
        border: 0,
        clip: "rect(0, 0, 0, 0)",
        height: "1px",
        margin: "-1px",
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        width: "1px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </caption>
  );
};

export default SROnlyTableCaption;
