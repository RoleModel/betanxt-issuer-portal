# LineMarker Component

A custom marker component for MUI X Charts based on the `LineMarker.svg` design. This component creates custom markers that can be used in line charts to replace the default circular marks.

## Features

- ✅ Custom SVG-based marker design with horizontal lines and center circle
- ✅ Configurable color and size
- ✅ Compatible with MUI X Charts MarkElement slot
- ✅ TypeScript support with proper MUI X Charts integration

## Usage

### Basic Usage

```tsx
import { createLineMarkerElement } from './LineMarker'

// In your chart component

;<MarkPlot
  slots={{
    mark: createLineMarkerElement({
      color: 'var(--mui-palette-chartSeries-3-main)',
      size: 20,
    }),
  }}
/>
```

### With VotingPerformanceChart

The component is already integrated into the `VotingPerformanceChart` and will automatically appear on line series data points when `showMark: true` is set.

## API

### `createLineMarkerElement(options)`

Factory function that creates a LineMarker component compatible with MUI X Charts.

#### Parameters

| Parameter       | Type     | Default     | Description                          |
| --------------- | -------- | ----------- | ------------------------------------ |
| `options.color` | `string` | `'#EB6333'` | Color of the marker lines and circle |
| `options.size`  | `number` | `24`        | Size of the marker in pixels         |

#### Returns

A React component that can be used as a MUI X Charts MarkElement.

### `LineMarker`

The base marker component.

#### Props

| Prop    | Type                            | Default     | Description                       |
| ------- | ------------------------------- | ----------- | --------------------------------- |
| `x`     | `string \| number \| undefined` | -           | X coordinate for marker placement |
| `y`     | `string \| number \| undefined` | -           | Y coordinate for marker placement |
| `color` | `string`                        | `'#EB6333'` | Color of the marker               |
| `size`  | `number`                        | `24`        | Size of the marker                |

## Design

The marker consists of:

- Left horizontal line
- Right horizontal line
- Center circle (outline only)
- All elements use the same color and stroke width

The design is based on the provided `LineMarker.svg` and scales proportionally with the `size` parameter.

## Example Integration

```tsx
// Enable marks on your line series
{
  type: 'line',
  data: percentVoted,
  label: 'Percent Voted',
  color: 'var(--mui-palette-chartSeries-3-main)',
  curve: 'catmullRom',
  showMark: true, // Important: enable marks
  yAxisId: 'rightAxis',
}

// Use custom marker
<MarkPlot
  slots={{ mark: createLineMarkerElement({ color: 'var(--mui-palette-chartSeries-3-main)', size: 20 }) }}
/>
```
