"use client";

import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React from "react";

export type ChartView = "aggregate" | "individual";

interface ChartToggleProps {
  value: ChartView;
  onChange: (value: ChartView) => void;
}

const ChartToggle: React.FC<ChartToggleProps> = ({ value, onChange }) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: ChartView | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <ToggleButtonGroup value={value} exclusive onChange={handleChange} size="small">
      <ToggleButton value="aggregate" aria-label="aggregate view">
        <GroupsIcon />
      </ToggleButton>
      <ToggleButton value="individual" aria-label="individual director view">
        <PersonIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ChartToggle;
