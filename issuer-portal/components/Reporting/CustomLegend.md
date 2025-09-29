# CustomLegend Component

A reusable custom legend component that uses LineMarker symbols for MUI X Charts line charts. This component replaces the default MUI X Charts legend with custom LineMarker symbols for a consistent visual design across all line charts.

## Features

- ✅ Reusable across all line charts in the application
- ✅ Uses LineMarker component as legend symbols
- ✅ Configurable direction (horizontal/vertical)
- ✅ Customizable marker size, spacing, and text styling
- ✅ TypeScript support with proper prop validation

## Installation

The component is already available in the Reporting components directory:

```tsx
import CustomLegend from '@/components/Reporting/CustomLegend'
```

## Basic Usage

### 1. Disable Default Legend

First, disable the built-in MUI X Charts legend:

```tsx
// For LineChart component
<LineChart
  // ... other props
  slots={{
    legend: () => null, // Disable default legend
  }}
/>

// For ChartDataProvider component
<ChartDataProvider>
  <ChartsSurface>
    {/* ... chart components but no ChartsLegend */}
  </ChartsSurface>
  {/* No ChartsLegend component here */}
</ChartDataProvider>
```

### 2. Add CustomLegend

Then add the CustomLegend component after your chart:

```tsx
const legendItems = [
  { label: 'Line Series', color: 'var(--mui-palette-chartSeries-1-main)', type: 'line' },
  { label: 'Bar Series', color: 'var(--mui-palette-chartSeries-2-main)', type: 'bar' },
  { label: 'Another Line', color: 'var(--mui-palette-chartSeries-3-main)', type: 'line' },
]

return (
  <Box>
    <LineChart /* ... */ />
    <CustomLegend items={legendItems} />
  </Box>
)
```

## API Reference

### Props

| Prop          | Type                              | Default        | Description                                      |
| ------------- | --------------------------------- | -------------- | ------------------------------------------------ |
| `items`       | `LegendItem[]`                    | **Required**   | Array of legend items with label and color       |
| `direction`   | `'horizontal' \| 'vertical'`      | `'horizontal'` | Layout direction for legend items                |
| `markerSize`  | `number`                          | `16`           | Size of LineMarker symbols in pixels             |
| `gap`         | `number`                          | `3`            | Spacing between legend items (MUI spacing units) |
| `textVariant` | `'body1' \| 'body2' \| 'caption'` | `'body2'`      | Typography variant for labels                    |

### Types

```tsx
interface LegendItem {
  label: string
  color: string
  type?: 'line' | 'bar' | 'area' // Determines legend symbol type
}
```

### Symbol Types

The `type` property determines which symbol is shown in the legend:

- **`'line'`**: Shows LineMarker symbol (custom design with horizontal lines and center circle)
- **`'bar'` or `'area'`**: Shows colored rectangle symbol (standard for bar/area charts)
- **`undefined`**: Defaults to LineMarker symbol for backward compatibility

## Complete Examples

### Example 1: IndividualDirectorChart (Current Implementation)

```tsx
import React from 'react'

import { Box, CircularProgress, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts'

import CustomLegend from './CustomLegend'

const IndividualDirectorChart = ({ data, directorName, loading }) => {
  // ... loading and empty state handling

  const legendItems = [
    { label: 'For', color: 'var(--mui-palette-chartSeries-1-main)', type: 'line' },
    { label: 'Against', color: 'var(--mui-palette-chartSeries-5-main)', type: 'line' },
    { label: 'Abstain', color: 'var(--mui-palette-chartSeries-2-main)', type: 'line' },
  ]

  return (
    <Box>
      <LineChart
        height={300}
        series={[
          {
            data: forVotes,
            label: 'For',
            color: 'var(--mui-palette-chartSeries-1-main)',
            curve: 'catmullRom',
            showMark: false, // Important: keep false to hide markers on lines
          },
          // ... other series
        ]}
        slots={{
          legend: () => null, // Disable default legend
        }}
        // ... other props
      />
      <CustomLegend items={legendItems} />
    </Box>
  )
}
```

### Example 2: Mixed Chart (Bars + Lines)

```tsx
const VotingPerformanceChart = ({ data }) => {
  const legendItems = [
    { label: 'Positions', color: 'var(--mui-palette-chartSeries-1-main)', type: 'bar' },
    { label: 'Shares', color: 'var(--mui-palette-chartSeries-2-main)', type: 'bar' },
    {
      label: 'Percent Voted',
      color: 'var(--mui-palette-chartSeries-3-main)',
      type: 'line',
    },
  ]

  return (
    <Card>
      <CardContent>
        <ChartDataProvider
          series={[
            {
              type: 'bar',
              data: positions,
              label: 'Positions',
              color: 'var(--mui-palette-chartSeries-1-main)',
            },
            {
              type: 'bar',
              data: shares,
              label: 'Shares',
              color: 'var(--mui-palette-chartSeries-2-main)',
            },
            {
              type: 'line',
              data: percentVoted,
              label: 'Percent Voted',
              color: 'var(--mui-palette-chartSeries-3-main)',
            },
          ]}
        >
          <ChartsSurface>
            <BarPlot />
            <LinePlot />
            {/* ... other chart components */}
          </ChartsSurface>
          <CustomLegend items={legendItems} />
        </ChartDataProvider>
      </CardContent>
    </Card>
  )
}
```

### Example 3: Custom Configuration

````tsx
<CustomLegend
  items={legendItems}
  direction="vertical"
  markerSize={20}
  gap={2}
  textVariant="body1"
/>
```### Example 3: Pure Line Charts

For charts that only contain line series (no bars, pies, etc.), this component provides a consistent visual identity by showing LineMarker symbols in the legend while keeping the actual chart lines clean without markers.

## Integration Guidelines

### When to Use CustomLegend

- ✅ **Pure Line Charts**: Charts with only line series
- ✅ **Consistent Branding**: When you want LineMarker symbols in legends
- ✅ **Custom Styling**: When default MUI legends don't match your design

### When NOT to Use CustomLegend

- ❌ **Mixed Chart Types**: Charts with bars + lines (use default MUI legend)
- ❌ **Pie Charts**: Different legend requirements
- ❌ **Simple Cases**: When default legend styling is sufficient

### Best Practices

1. **Color Consistency**: Always use the same colors in `legendItems` as in your chart series
2. **Accessibility**: Ensure sufficient color contrast for legend text
3. **Responsive Design**: Consider using `direction="vertical"` on mobile breakpoints
4. **Performance**: Extract `legendItems` to component level to avoid recreating on each render

## Maintenance Notes

- The component depends on `LineMarker.tsx` - ensure both components stay in sync
- Color variables should match your MUI theme's chart series palette
- Test legend rendering with different numbers of items (1-10+)

## Example Output

The CustomLegend renders as a horizontal row (by default) of items, each showing:

- A LineMarker symbol with the specified color
- The label text next to the symbol
- Proper spacing and alignment

This creates a cohesive visual experience where the legend symbols match the LineMarker design used elsewhere in the application.
````
