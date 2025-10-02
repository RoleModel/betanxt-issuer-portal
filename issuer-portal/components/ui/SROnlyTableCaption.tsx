import React from 'react'

export default function SROnlyTableCaption({ children }: { children: React.ReactNode }) {
  return (
    <caption
      style={{
        border: 0,
        clip: 'rect(0, 0, 0, 0)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        width: '1px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </caption>
  )
}
